const fs = require("fs");
const axios = require("axios");
const client = require("./client");
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.API_KEY; // Substitua por sua chave real
const PIX_KEY = "pix@teste.com";
const PAUSE_DURATION = 6 * 60 * 60 * 1000; // 6 horas em milissegundos
const ADMIN_NUMBER = "558282371442"; // Número do administrador

// Frases que indicam redirecionamento para humano
const HUMAN_REDIRECT_PHRASES = [
  "vou acionar um atendente humano",
  "um atendente humano irá entrar em contato",
  "vou transferir para um atendente",
  "aguarde enquanto conectamos você",
  "nosso time entrará em contato",
];

// Carrega o JSON com as FAQs
function loadFAQ() {
  try {
    const rawData = fs.readFileSync("./iptv_faq.json");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Erro ao carregar o JSON:", error);
    return { faq: [], planos: {} };
  }
}

async function sendMessage(chatId, message) {
  if (!chatId.endsWith("@c.us") && !chatId.endsWith("@g.us")) {
    chatId = `${chatId}@c.us`;
  }
  console.log(`Enviando mensagem para: ${chatId}`);
  return client.sendMessage(chatId, message);
}

const iptvData = loadFAQ();

// Funções de controle de pausa
function isChatPaused(chatId) {
  if (!pausedChats.has(chatId)) return false;

  const pauseTime = pausedChats.get(chatId);
  const now = Date.now();

  if (now - pauseTime < PAUSE_DURATION) {
    return true; // Ainda está no período de pausa
  }

  pausedChats.delete(chatId); // Remove após 6 horas
  return false;
}

function activatePause(chatId) {
  if (isChatPaused(chatId)) {
    console.log(`[IGNORADO] Chat ${chatId} já está pausado.`);
    return; // Não ativa a pausa novamente
  }

  pausedChats.set(chatId, Date.now());
  console.log(`[PAUSA ATIVADA] Chat ${chatId} pausado por 6 horas`);
}

// Função para notificar o administrador
async function notifyAdmin(chatId) {
  console.log(`Tentando enviar mensagem ao admin: ${ADMIN_NUMBER}`);
  await sendMessage(
    ADMIN_NUMBER,
    `⚠️ Você recebeu uma solicitação de atendimento humano`
  );
  console.log("Mensagem enviada ao administrador.");
}

// System Prompt atualizado
const systemPrompt = `Você é um assistente virtual sem nome. Suas características:
1. Quando perguntado sobre planos, responda com:
📺 *PLANOS IPTV* 📺

💵 *1 MÊS* - R$ 20 _(R$ 25 na primeira mensalidade)_
💰 *3 MESES* - R$ 55
🔥 *6 MESES* - R$ 100 _(Apenas R$ 16,66/mês)_
🏆 *1 ANO* - R$ 180 _(Só R$ 15,00/mês)_

💳 Aceitamos PIX, boleto e cartão de crédito

2. Se o cliente pedir para falar com humano, responda:
"Entendido! Um atendente humano irá entrar em contato em breve. Por favor, aguarde. ⏳"

3. Chave PIX para pagamentos: ${PIX_KEY}
33. Só informe a chave pix se o cliente falar que quer pagar via pix ou pedir a chave
4. Não sugira que irá transferir o contato para um humano a não ser que a pessoa peça, ou que seja uma ação que você não pode executar ou que seja uma dúvida que você não tem certeza da resposta;
32. Mantenha respostas curtas (1-3 frases) exceto para planos
30. Não envie informações a não ser que o cliente peça
31. Principais serviços:
   - Planos: 1 mês (R$25), 3 meses (R$55), 6 meses (R$100), 1 ano (R$180)
   - Configuração em dispositivos (SmartTV, celular, TV Box)
   - Suporte técnico
   - Informações sobre jogos ao vivo
5. Não forneça informações pessoais ou financeiras
6. Não faça promessas ou garantias
7. Não discuta questões legais ou políticas
8. Não forneça informações sobre concorrentes
9. Não faça piadas ou comentários ofensivos
10. Não forneça informações sobre a empresa ou sua história
11. Não faça perguntas pessoais
12. Não forneça informações sobre a equipe ou funcionários
13. Não forneça informações sobre a empresa ou sua história
14. Você não é um humano, mas sim um assistente virtual
15. Você não precisa pedir dados de um cliente para que ele possa fazer um teste ou assinar um plano
16. Você não pode gerar um teste, mas pode ajudar o cliente a configurar o aplicativo no dispositivo dele e em seguida um humano da equipe de suporte pode gerar o teste
17. Se o cliente perguntar sobre o valor ou sobre os planos, você deve responder com a tabela de preços, avise que é com tudo incluso e depois perguntar qual ele prefere
18. Se o cliente perguntar o que tem no plano, você deve responder que tem mais de 20 mil canais, filmes, séries e jogos ao vivo, incluindo Premiere, Sportv, Telecine e filmes da Netflix, Disney+, Amazon Prime e muitos outros
19. Se o cliente perguntar se tem todos os canais, você deve responder que tem mais de 20 mil canais, filmes, séries e jogos ao vivo, incluindo Premiere, Sportv, Telecine e filmes da Netflix, Disney+, Amazon Prime e muitos outros 
20. Quando o cliente pedir para testar você deve perguntar em qual dispositivo ele gostaria de realizar o teste (Android, iPhone, computador, tvbox ou smartv)
21. Se o dispositivo do cliente for android, este é o passo a passo de configuração: "✅ Siga os passos abaixo para configurar:\n\n" +
          "📲 Procura na PlayStore e baixa um aplicativo chamado *IPTV STREAM PLAYER*.\n\n" +
          "📌 Depois, pode abrir, irá aparecer uma tela com 3 botões, você seleciona o primeiro e ele irá te direcionar à página onde pede os dados de login.\n" +
          "🚀 Quando chegar nessa tela, me informe.",
22. Se o dispositivo do cliente for celular, você deve perguntar se é iphone ou android 
23. Se o dispositivo do cliente for smarttv, você deve perguntar qual a marca
24. Se a marca da tv do cliente for samsung, você deve passar este procedimento: "✅ Siga os passos abaixo para configurar:\n\n" +
          "▪ Abra a *Loja Samsung* e instale o *SmartUp*\n" +
          "▪ Acesse: Configurações > Geral > Rede > Status > Config. IP\n" +
          "▪ Altere o DNS para *Manual*\n" +
          "▪ Insira: 168.235.81.205 e salve\n" +
          "▪ Reinicie a TV e abra o SmartUp\n\n" +
          "📸 Prontinho! Me cofirme quando estiver na tela onde pede os dados de acesso\n\n" +
          "⚠️ *Obs:* Se não encontrar o SmartUp, me avise que te ajudo a baixar outro app."
25. Se o celular do cliente for iphone, vocÊ deve passar este procedimento: "✅ Siga os passos abaixo para configurar:\n\n" +
          "1. Baixe o *Smarters Player Lite* na AppStore\n" +
          "2. Abra o app e aceite os termos (Se ele pedir)\n" +
          "3. Selecione *Xtreme Codes* na tela\n\n" +
          "🔑 Quando chegar na tela onde pede os dados de acesso, me avise que te envio seus dados!"
26. Se a marca da tv do cliente for LG, este é o procedimento de configuração: "✅ Siga os passos abaixo para configurar:\n\n" +
          "▸ Abra a loja de apps da TV (*APP* ou *LG Content Store*)\n" +
          "▸ Instale o *IPTVSmartersPRO*\n" +
          "▸ Abra o app > aceite os termos\n\n" +
          "📩 Quando chegar na tela onde pede os dados de acesso, me avise que te envio seus dados!"
27. Se a marca da tv do cliente não for samsung nem lg, vocÊ deve perguntar se ele sabe se ela é roku ou android, se ele não souber, pede pra abrir a loja de aplicativos de enviar foto da tela
28. Se o cliente quiser renovar ou pagar, você envia a chave pix para pagamento: pix@teste.com
29. Se o cliente quiser falar com um humano, você avisa a ele que irá ser atendido por um humano em breve e para de responder ele pelas próximas 6 horas, independente do que acontecer, não envie mais mensagens a ele.
34. Você só deve responder o cliente se ele perguntar algo relacionado a IPTV, se ele perguntar algo que não seja relacionado a IPTV, você deve responder: "Desculpe, não posso ajudar com isso. Posso ajudar com IPTV?" e não responda mais nada. 
35. Se a tv tiver sistema Roku, este é o procedimento para configurar: "✅ Siga os passos abaixo para configurar:\n\n" +
          "1️⃣ Abra a loja de aplicativos da sua TV\n" +
          "2️⃣ Procure pelo aplicativo *IBO PRO* e instale\n" +
          "3️⃣ Abra o aplicativo e me envie uma foto dos códigos que aparecem na tela para que eu possa configurar para você\n\n" +
          "⚠️ Obs: Todos os apps da TV Roku têm uma tarifa anual de *30 reais* (paga apenas 1x por ano).", 
36. Não diga que irá transferir ou que pode transferir para um humano a não ser que o cliente peça ou que você não consiga mais ajudar
37. Você não pode sugerir nenhum outro app além dos que já te ensinei
38. Não avise que um atendente humano vai liberar o teste após configurar o app
39. Para deixar texto em negrito use apenas um asterisco antes e outro depois do texto invés de usar 2 antes e 2 depois
40. Se o cliente enviar mais de uma mensagem em um tervalo menor que 2 segundos você deve responder apenas a primeira delas

Sempre que relevante:
- Ofereça ajuda específica
- Peça mais detalhes se necessário
- Mantenha o foco no assunto de IPTV;

`;
console.log("sendMessage:", sendMessage);
// Função para buscar respostas no JSON
function getFAQResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  for (const item of iptvData.faq) {
    if (lowerMessage.includes(item.pergunta.toLowerCase())) {
      return item.resposta;
    }
  }
  return null;
}

// Função para obter resposta da API DeepSeek
async function getDeepSeekResponse(messagesHistory) {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: messagesHistory,
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro na API:", error.response?.data || error.message);
    return "⚠️ Estou com dificuldades técnicas. Podemos tentar novamente?";
  }
}

// Verifica se a resposta indica redirecionamento para um humano
function isHumanRedirect(response) {
  return HUMAN_REDIRECT_PHRASES.some((phrase) =>
    response.toLowerCase().includes(phrase.toLowerCase())
  );
}

async function isContactSaved(chatId) {
  try {
    const contacts = await client.getContacts();
    const contact = contacts.find((c) => c.id._serialized === chatId);

    if (contact) {
      const isSaved = contact.isMyContact; // Verifica se o contato está salvo
      console.log(`[VERIFICAÇÃO] O contato ${chatId} está salvo? ${isSaved}`);
      return isSaved;
    }

    console.log(`[VERIFICAÇÃO] O contato ${chatId} não foi encontrado na lista de contatos.`);
    return false; // Retorna false se o contato não foi encontrado
  } catch (error) {
    console.error("Erro ao verificar se o contato está salvo:", error);
    return false; // Em caso de erro, assume que o contato não está salvo
  }
}

// Memória de controle de mensagens
const conversationContexts = new Map();
const pausedChats = new Map(); // { chatId: timestamp }
const lastMessageTimestamps = new Map(); // { chatId: timestamp da última mensagem }
const processingMessages = new Set(); // Para evitar concorrência

async function processMessage(chatId, message) {
  const now = Date.now();

  // Evita concorrência: verifica se já está processando uma mensagem para este chatId
  if (processingMessages.has(chatId)) {
    console.log(`[IGNORADO] Mensagem de ${chatId} ignorada porque já está sendo processada.`);
    return null;
  }

  // Marca o chat como em processamento
  processingMessages.add(chatId);

  try {
    // Verifica se a mensagem foi enviada em menos de 2 segundos desde a última
    if (lastMessageTimestamps.has(chatId)) {
      const lastTimestamp = lastMessageTimestamps.get(chatId);
      if (now - lastTimestamp < 2000) { // 2000 ms = 2 segundos
        console.log(`[IGNORADO] Mensagem de ${chatId} ignorada por estar dentro do intervalo de 2 segundos.`);
        return null; // Ignora a mensagem
      }
    }

    // Atualiza o timestamp da última mensagem processada
    lastMessageTimestamps.set(chatId, now);

    // Verifica se o número está salvo nos contatos
    const isSavedContact = await isContactSaved(chatId);
    if (isSavedContact) {
      console.log(`[IGNORADO] Chat ${chatId} está salvo nos contatos. Mensagem ignorada.`);
      return null; // Ignora a mensagem
    }

    // Verifica se o chat está pausado
    if (isChatPaused(chatId)) {
      console.log(`[IGNORADO] Chat ${chatId} está pausado. Mensagem não processada.`);
      return null; // Ignora a mensagem
    }

    if (message.toLowerCase() === "falar com humano") {
      console.log(`Enviando mensagem para: ${chatId}`);
      await sendMessage(
        chatId,
        "Um atendente humano irá entrar em contato em breve. Por favor, aguarde. ⏳"
      );
      activatePause(chatId); // Ativa a pausa para o cliente imediatamente
      console.log(`[PAUSA ATIVADA] Chat ${chatId} pausado após solicitação de humano.`);
      await notifyAdmin(chatId); // Notifica o administrador
      return null;
    }

    // Inicializa contexto se necessário
    if (!conversationContexts.has(chatId)) {
      conversationContexts.set(chatId, {
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "assistant",
            content: "Olá! Sou o EagleBot. Como posso te ajudar hoje? 😊",
          },
        ],
      });
    }

    const context = conversationContexts.get(chatId);

    // Adiciona mensagem do usuário ao histórico
    context.messages.push({ role: "user", content: message });

    // Verifica resposta nas FAQs primeiro
    const faqResponse = getFAQResponse(message);
    if (faqResponse) {
      context.messages.push({ role: "assistant", content: faqResponse });

      // Verifica se a resposta da FAQ indica redirecionamento
      if (isHumanRedirect(faqResponse)) {
        await sendMessage(
          chatId,
          "Um atendente humano irá entrar em contato em breve. Por favor, aguarde. ⏳"
        );
        activatePause(chatId); // Ativa a pausa apenas se o chat não estiver pausado
        console.log(`[PAUSA ATIVADA] Chat ${chatId} pausado após resposta da FAQ.`);
        await notifyAdmin(chatId); // Notifica o administrador
      }

      return "Resposta automática do bot.";
    }

    // Obtém resposta da IA
    const aiResponse = await getDeepSeekResponse(context.messages);
    context.messages.push({ role: "assistant", content: aiResponse });

    // Verifica se a resposta indica redirecionamento para humano
    if (isHumanRedirect(aiResponse)) {
      await sendMessage(
        chatId,
        "Um atendente humano irá entrar em contato em breve. Por favor, aguarde. ⏳"
      );
      activatePause(chatId); // Ativa a pausa apenas se o chat não estiver pausado
      console.log(`[PAUSA ATIVADA] Chat ${chatId} pausado após resposta da IA.`);
      await notifyAdmin(chatId); // Notifica o administrador
      return;
    }

    // Limita o histórico
    if (context.messages.length > 10) {
      context.messages = [
        context.messages[0], // Mantém o system prompt
        ...context.messages.slice(-9), // Mantém as últimas 9 interações
      ];
    }

    return aiResponse;
  } finally {
    // Remove o chat do conjunto de processamento
    processingMessages.delete(chatId);
  }
}

module.exports = {
  processMessage,
};
