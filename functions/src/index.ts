
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { enviarWhatsApp, enviarTelegram } from './helpers/enviarNotificacao';

admin.initializeApp();

const db = admin.firestore();

// Cloud Function para inscrição em aulas
export const inscrever = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { matricula, aulaId } = data;

  try {
    // Verificar se o aluno está suspenso
    const alunoDoc = await db.collection('alunos').doc(matricula).get();
    if (!alunoDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Aluno não encontrado');
    }

    const alunoData = alunoDoc.data();
    if (alunoData?.statusSuspenso) {
      const agora = new Date();
      const fimSuspensao = alunoData.fimSuspensao?.toDate();
      if (fimSuspensao && fimSuspensao > agora) {
        throw new functions.https.HttpsError('permission-denied', 'Aluno está suspenso');
      }
    }

    // Verificar se já existe inscrição ativa
    const inscricaoExistente = await db.collection('inscricoes')
      .where('matricula', '==', matricula)
      .where('aulaId', '==', aulaId)
      .where('status', 'in', ['confirmado', 'espera'])
      .get();

    if (!inscricaoExistente.empty) {
      throw new functions.https.HttpsError('already-exists', 'Já existe inscrição para esta aula');
    }

    // Contar inscrições confirmadas
    const confirmadosQuery = await db.collection('inscricoes')
      .where('aulaId', '==', aulaId)
      .where('status', '==', 'confirmado')
      .get();

    const vagasOcupadas = confirmadosQuery.size;
    const status = vagasOcupadas < 6 ? 'confirmado' : 'espera';

    // Criar inscrição
    const inscricaoRef = await db.collection('inscricoes').add({
      matricula,
      aulaId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status,
      presenca: false
    });

    // Buscar dados da aula
    const aulaDoc = await db.collection('aulas').doc(aulaId).get();
    const aulaData = aulaDoc.data();

    // Enviar notificação
    const mensagem = status === 'confirmado' 
      ? `Inscrição confirmada para a aula de ${aulaData?.data.toDate().toLocaleDateString()} às ${aulaData?.horario}. Link: ${aulaData?.linkMeet}`
      : `Você foi adicionado à lista de espera para a aula de ${aulaData?.data.toDate().toLocaleDateString()} às ${aulaData?.horario}.`;

    if (alunoData?.emailWhatsApp) {
      await enviarWhatsApp(alunoData.emailWhatsApp, mensagem);
    }
    
    if (alunoData?.telegramChatId) {
      await enviarTelegram(mensagem);
    }

    return { status, inscricaoId: inscricaoRef.id };
  } catch (error) {
    console.error('Erro na inscrição:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

// Cloud Function para marcar presença
export const marcarPresenca = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { inscricaoId } = data;

  try {
    await db.collection('inscricoes').doc(inscricaoId).update({
      presenca: true
    });

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao marcar presença:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

// Cloud Function para marcar falta e suspender aluno
export const marcarFalta = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { matricula, aulaId, tipo } = data;

  try {
    const agora = new Date();
    let diasSuspensao = 0;

    switch (tipo) {
      case 'cancel≥4h':
        diasSuspensao = 14;
        break;
      case 'cancel<4h':
        diasSuspensao = 21;
        break;
      case 'falta':
        diasSuspensao = 28;
        break;
    }

    const fimSuspensao = new Date(agora.getTime() + (diasSuspensao * 24 * 60 * 60 * 1000));

    // Criar suspensão
    await db.collection('suspensoes').add({
      matricula,
      motivo: tipo,
      inicio: admin.firestore.FieldValue.serverTimestamp(),
      fim: admin.firestore.Timestamp.fromDate(fimSuspensao)
    });

    // Atualizar status do aluno
    await db.collection('alunos').doc(matricula).update({
      statusSuspenso: true,
      fimSuspensao: admin.firestore.Timestamp.fromDate(fimSuspensao)
    });

    // Cancelar inscrição atual
    const inscricaoQuery = await db.collection('inscricoes')
      .where('matricula', '==', matricula)
      .where('aulaId', '==', aulaId)
      .where('status', 'in', ['confirmado', 'espera'])
      .get();

    if (!inscricaoQuery.empty) {
      await inscricaoQuery.docs[0].ref.update({ status: 'cancelado' });
    }

    // Promover próximo da fila se necessário
    if (!inscricaoQuery.empty && inscricaoQuery.docs[0].data().status === 'confirmado') {
      const proximoEspera = await db.collection('inscricoes')
        .where('aulaId', '==', aulaId)
        .where('status', '==', 'espera')
        .orderBy('timestamp', 'asc')
        .limit(1)
        .get();

      if (!proximoEspera.empty) {
        const proximoDoc = proximoEspera.docs[0];
        await proximoDoc.ref.update({ status: 'confirmado' });

        // Notificar aluno promovido
        const proximoMatricula = proximoDoc.data().matricula;
        const proximoAlunoDoc = await db.collection('alunos').doc(proximoMatricula).get();
        const proximoAlunoData = proximoAlunoDoc.data();

        const aulaDoc = await db.collection('aulas').doc(aulaId).get();
        const aulaData = aulaDoc.data();

        const mensagemPromocao = `Boa notícia! Você foi promovido da lista de espera para a aula de ${aulaData?.data.toDate().toLocaleDateString()} às ${aulaData?.horario}. Link: ${aulaData?.linkMeet}`;

        if (proximoAlunoData?.emailWhatsApp) {
          await enviarWhatsApp(proximoAlunoData.emailWhatsApp, mensagemPromocao);
        }
        
        if (proximoAlunoData?.telegramChatId) {
          await enviarTelegram(mensagemPromocao);
        }
      }
    }

    // Notificar aluno suspenso
    const alunoDoc = await db.collection('alunos').doc(matricula).get();
    const alunoData = alunoDoc.data();

    const mensagemSuspensao = `Você foi suspenso até ${fimSuspensao.toLocaleDateString()} devido a: ${tipo}`;

    if (alunoData?.emailWhatsApp) {
      await enviarWhatsApp(alunoData.emailWhatsApp, mensagemSuspensao);
    }
    
    if (alunoData?.telegramChatId) {
      await enviarTelegram(mensagemSuspensao);
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao marcar falta:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});
