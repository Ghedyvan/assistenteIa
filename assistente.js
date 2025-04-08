const axios = require("axios");
const readline = require("readline");
const fs = require('fs');

// Carrega o JSON com as FAQs
const loadFAQ = () => {
  try {
    const rawData = fs.readFileSync('./iptv_faq.json');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Erro ao carregar o JSON:", error);
    return { faq: [], planos: {} };
  }
};

const iptvData = loadFAQ(); // Carrega os dados do JSON

// Função para buscar respostas no JSON
function getFAQResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  for (const item of iptvData.faq) {
    if (lowerMessage.includes(item.pergunta.toLowerCase())) {
      return item.resposta;
    }
  }
  return null; // Retorna null se não encontrar
}

// Configurações
const DEEPSEEK_API_KEY = "sk-90b7e3922d5d4947b9f643371ad105f1"; 

// Memória de conversas
const conversationContexts = new Map();

// Interface para entrada/saída no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const IPTV_PLANS = {
  description:
    `📺 *PLANOS IPTV* 📺\n\n` +
    `💵 *1 MÊS* - R$ 20 _(R$ 25 na primeira mensalidade)_\n` +
    `💰 *3 MESES* - R$ 55\n` +
    `🔥 *6 MESES* - R$ 100 _(Apenas R$ 16,66/mês)_\n` +
    `🏆 *1 ANO* - R$ 180 _(Só R$ 15,00/mês)_\n\n` +
    `💳 Aceitamos PIX, boleto e cartão de crédito\n\n`,
  keywords: [
    "planos",
    "preços",
    "valores",
    "mensalidade",
    "quanto custa",
    "assinar",
    "assinatura",
  ],
};
  
//   return "desconheci

// Modifique a função getDeepSeekResponse
async function getDeepSeekResponse(messagesHistory) {
  const lastMessage = messagesHistory[messagesHistory.length - 1].content;

  // 4º Chama a API DeepSeek se não encontrar respostas locais
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: messagesHistory,
      temperature: 0.7,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na API:', error.response?.data || error.message);
    return '⚠️ Estou com dificuldades técnicas. Podemos tentar novamente?';
  }
}

// Atualize o systemPrompt para incluir referência aos planos
const systemPrompt = `Você é o EagleBot, assistente virtual da Eagle IPTV. Suas características:
  1. Quando perguntado sobre planos, responda EXATAMENTE com esta informação:
  ${IPTV_PLANS.description}
  2. Mantenha respostas curtas (1-3 frases) exceto para planos
  3. Use emojis moderadamente
4. Principais serviços:
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
          "📸 Prontinho! Me envie uma foto da tela que te mando seus dados de acesso.\n\n" +
          "⚠️ *Obs:* Se não encontrar o SmartUp, me avise que te ajudo a baixar outro app."
25. Se o celular do cliente for iphone, vocÊ deve passar este procedimento: "✅ Siga os passos abaixo para configurar:\n\n" +
          "1. Baixe o *Smarters Player Lite* na AppStore\n" +
          "2. Abra o app e aceite os termos (Se ele pedir)\n" +
          "3. Selecione *Xtreme Codes* na tela\n\n" +
          "🔑 Quando chegar na tela de login, me avise que te envio seus dados!"
26. Se a marca da tv do cliente for LG, este é o procedimento de configuração: "✅ Siga os passos abaixo para configurar:\n\n" +
          "▸ Abra a loja de apps da TV (*APP* ou *LG Content Store*)\n" +
          "▸ Instale o *IPTVSmartersPRO*\n" +
          "▸ Abra o app > aceite os termos\n\n" +
          "📩 Quando chegar na tela de login, me avise que te envio seus dados!"
27. Se a marca da tv do cliente não for samsung nem lg, vocÊ deve perguntar se ele sabe se ela é roku ou android, se ele não souber, pede pra abrir a loja de aplicativos de enviar foto da tela
28. Se o cliente quiser renovar ou pagar, você envia a chave pix para pagamento: pix@teste.com
29. Se o cliente quiser falar com um humano, você avisa a ele que irá ser atendido por um humano em breve e para de responder ele pelas próximas 6 horas, independente do que acontecer, não envie mais mensagens a ele.


Sempre que relevante:
- Ofereça ajuda específica
- Peça mais detalhes se necessário
- Mantenha o foco no assunto de IPTV`;

// Função principal do chat
async function runChat() {
  console.log("=== BOT DE ATENDIMENTO IPTV ===");
  console.log('Digite sua mensagem ou "sair" para encerrar\n');

  const chatId = "terminal-user"; // ID fixo para o terminal

  // Inicializa contexto
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
    console.log("Bot: Olá! Sou o EagleBot. Como posso te ajudar hoje? 😊");
  }

  // Função recursiva para manter o chat ativo
  const chatLoop = async () => {
    rl.question("Você: ", async (userInput) => {
      if (userInput.toLowerCase() === "sair") {
        console.log("Bot: Até logo! Se precisar de novo, é só chamar. 👋");
        rl.close();
        return;
      }

      const context = conversationContexts.get(chatId);

      // Adiciona mensagem do usuário ao histórico
      context.messages.push({ role: "user", content: userInput });

      try {
        // Obtém resposta da IA
        const aiResponse = await getDeepSeekResponse(context.messages);

        // Adiciona resposta ao histórico e exibe
        context.messages.push({ role: "assistant", content: aiResponse });
        console.log("Bot:", aiResponse);

        // Limita o histórico para não sobrecarregar a API
        if (context.messages.length > 10) {
          context.messages = [
            context.messages[0], // Mantém o system prompt
            ...context.messages.slice(-9), // Mantém as últimas 9 interações
          ];
        }
      } catch (error) {
        console.error('Erro na API:', error.response?.data || error.message);
        console.error('Detalhes do erro:', error); // Adiciona mais detalhes do erro
        return '⚠️ Estou com dificuldades técnicas. Podemos tentar novamente?';
      }

      // Continua o loop
      chatLoop();
    });
  };

  // Inicia o loop do chat
  chatLoop();
}

// Tratamento para encerramento
rl.on("close", () => {
  console.log("\nChat encerrado. Obrigado por testar!");
  process.exit(0);
});

// Inicia o chat
runChat();