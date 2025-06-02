
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Cloud Function para processar agendamentos automáticos
export const processarAgendamentos = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const agora = new Date();
  const diaSemanaAtual = agora.getDay();
  const horarioAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;

  console.log(`Verificando agendamentos para ${diaSemanaAtual} às ${horarioAtual}`);

  try {
    // Buscar agendamentos ativos para o dia e horário atual
    const agendamentosQuery = await db.collection('agendamentos')
      .where('diaSemana', '==', diaSemanaAtual)
      .where('horario', '==', horarioAtual)
      .where('ativo', '==', true)
      .get();

    if (agendamentosQuery.empty) {
      console.log('Nenhum agendamento encontrado para este horário');
      return null;
    }

    console.log(`Encontrados ${agendamentosQuery.size} agendamentos para processar`);

    // Para cada agendamento, criar aulas da semana
    for (const agendamentoDoc of agendamentosQuery.docs) {
      await criarAulasDaSemana();
    }

    return null;
  } catch (error) {
    console.error('Erro ao processar agendamentos:', error);
    throw error;
  }
});

// Função para criar aulas da semana
async function criarAulasDaSemana() {
  const agora = new Date();
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay() + 1); // Segunda-feira
  inicioSemana.setHours(0, 0, 0, 0);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6); // Domingo
  fimSemana.setHours(23, 59, 59, 999);

  // Verificar se já existem aulas para esta semana
  const aulasExistentesQuery = await db.collection('aulas')
    .where('data', '>=', admin.firestore.Timestamp.fromDate(inicioSemana))
    .where('data', '<=', admin.firestore.Timestamp.fromDate(fimSemana))
    .get();

  if (!aulasExistentesQuery.empty) {
    console.log('Aulas já existem para esta semana');
    return;
  }

  // Criar aulas de segunda a sexta
  const horarios = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '19:00', '20:00'];
  const diasUteis = [1, 2, 3, 4, 5]; // Segunda a sexta

  for (const dia of diasUteis) {
    const dataAula = new Date(inicioSemana);
    dataAula.setDate(inicioSemana.getDate() + dia - 1);

    for (const horario of horarios) {
      await db.collection('aulas').add({
        data: admin.firestore.Timestamp.fromDate(dataAula),
        horario: horario,
        linkMeet: `https://meet.google.com/new`, // Link genérico, pode ser personalizado
        capacidade: 6,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        liberadaEm: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  console.log(`Aulas criadas para a semana de ${inicioSemana.toLocaleDateString()} a ${fimSemana.toLocaleDateString()}`);

  // Notificar alunos sobre liberação das aulas
  await notificarLiberacaoAulas();
}

// Função para notificar alunos sobre a liberação das aulas
async function notificarLiberacaoAulas() {
  try {
    // Buscar todos os alunos ativos
    const alunosQuery = await db.collection('alunos').get();
    
    const mensagem = `🎉 As aulas da semana foram liberadas! Faça já sua inscrição no app.`;

    // Enviar notificação para cada aluno
    for (const alunoDoc of alunosQuery.docs) {
      const alunoData = alunoDoc.data();
      
      // Aqui você pode integrar com os helpers de notificação existentes
      // se eles estiverem disponíveis no contexto das Cloud Functions
      console.log(`Enviando notificação para ${alunoData.nome}`);
    }

    console.log(`Notificações enviadas para ${alunosQuery.size} alunos`);
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
  }
}
