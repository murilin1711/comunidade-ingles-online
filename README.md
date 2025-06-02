
# Plataforma de Aulas - Sistema de Inscrições

Sistema interno para gerenciamento de inscrições em aulas, desenvolvido com React+Vite no frontend e Firebase no backend.

## Funcionalidades

- **Cadastro e Login de Alunos**: Sistema de autenticação usando matrícula@comunidade.app
- **Dashboard do Aluno**: Visualização e inscrição em aulas disponíveis
- **Dashboard do Professor**: Gerenciamento de aulas, presença e suspensões
- **Sistema de Suspensões**: Controle automático de penalidades
- **Notificações**: WhatsApp (Twilio) e Telegram para comunicação

## Estrutura do Projeto

### Frontend (React + Vite)
- `/src/pages/Login.tsx` - Tela de login
- `/src/pages/Cadastro.tsx` - Cadastro de novos alunos
- `/src/pages/DashboardAluno.tsx` - Dashboard para alunos
- `/src/pages/DashboardProfessor.tsx` - Dashboard para professores
- `/src/contexts/AuthContext.tsx` - Contexto de autenticação
- `/src/lib/firebase.ts` - Configuração do Firebase

### Backend (Firebase Functions)
- `/functions/src/index.ts` - Cloud Functions principais
- `/functions/src/helpers/enviarNotificacao.ts` - Helper para notificações

### Firestore Collections
- `alunos` - Dados dos alunos e professores
- `aulas` - Aulas disponíveis
- `inscricoes` - Inscrições dos alunos
- `suspensoes` - Histórico de suspensões

## Instalação Local

### Pré-requisitos
- Node.js (versão 18+)
- Firebase CLI: `npm install -g firebase-tools`
- Conta Firebase configurada

### Frontend

1. Clone o repositório e instale as dependências:
```bash
npm install
```

2. Configure o Firebase no arquivo `src/lib/firebase.ts` com suas credenciais.

3. Execute o desenvolvimento:
```bash
npm run dev
```

### Backend (Cloud Functions)

1. Entre na pasta functions:
```bash
cd functions
npm install
```

2. Configure as variáveis de ambiente:
```bash
# Via Firebase CLI
firebase functions:config:set twilio.sid="YOUR_TWILIO_SID"
firebase functions:config:set twilio.token="YOUR_TWILIO_TOKEN"
firebase functions:config:set twilio.from="whatsapp:+1415XXXXXXX"
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
firebase functions:config:set telegram.chat_id="YOUR_CHAT_ID"

# Ou via .env local (para emulador)
# Crie um arquivo .env na pasta functions:
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_FROM=whatsapp:+1415XXXXXXX
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

3. Para desenvolvimento local com emulador:
```bash
npm run serve
```

4. Para deploy das functions:
```bash
npm run deploy
# ou
firebase deploy --only functions
```

### Configuração do Firestore

1. Configure as regras de segurança:
```bash
firebase deploy --only firestore:rules
```

2. Configure os índices:
```bash
firebase deploy --only firestore:indexes
```

## Deploy

### Frontend (Vercel)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no Vercel com suas credenciais Firebase
3. Deploy automático a cada push

### Backend (Firebase Functions)

```bash
firebase deploy --only functions
```

## Configuração das Notificações

### Twilio (WhatsApp)
1. Crie uma conta no Twilio
2. Configure o WhatsApp Business API
3. Obtenha: Account SID, Auth Token, e número WhatsApp

### Telegram
1. Crie um bot via @BotFather
2. Obtenha o Bot Token
3. Obtenha o Chat ID do grupo/canal

## Uso do Sistema

### Para Alunos
1. Cadastre-se com matrícula, nome, email/WhatsApp e Telegram
2. Faça login com matrícula e senha
3. Visualize aulas disponíveis e inscreva-se
4. Receba notificações de confirmação/lista de espera

### Para Professores
1. Conta deve ter `role: "professor"` no Firestore (configuração manual)
2. Selecione uma aula no dashboard
3. Gerencie presenças e aplique penalidades
4. Sistema automatiza suspensões e promoções da fila

### Sistema de Suspensões
- **Cancelamento ≥4h**: 14 dias de suspensão
- **Cancelamento <4h**: 21 dias de suspensão  
- **Falta sem aviso**: 28 dias de suspensão

## Estrutura de Dados

### Alunos
```javascript
{
  matricula: string,
  nome: string,
  emailWhatsApp: string,
  telegramChatId: string,
  role: "aluno" | "professor",
  statusSuspenso: boolean,
  fimSuspensao: Timestamp | null
}
```

### Aulas
```javascript
{
  data: Timestamp,
  horario: string,
  linkMeet: string,
  capacidade: 6
}
```

### Inscrições
```javascript
{
  matricula: string,
  aulaId: string,
  timestamp: Timestamp,
  status: "confirmado" | "espera" | "cancelado",
  presenca: boolean
}
```

## Tecnologias Utilizadas

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase Functions, Node.js, TypeScript
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **Notificações**: Twilio (WhatsApp), Telegram Bot API
- **Deploy**: Vercel (frontend), Firebase (backend)
