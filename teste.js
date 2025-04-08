const readline = require('readline');
const { processMessage, isChatPaused } = require('./bot_core');

// Configuração da interface de leitura do terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para mostrar o status da pausa
function showPauseStatus(chatId) {
  const paused = isChatPaused(chatId);
  // console.log(paused ? '🔴 Chat PAUSADO (6 horas)' : '🟢 Chat ATIVO');
  // console.log('----------------------------------------');
}

// Função principal do chat
async function chatLoop(chatId = "terminal-user") {
  // console.log('\n=== TESTE INTERATIVO DO EAGLEBOT ===');
  // console.log('Digite suas mensagens para testar o bot');
  // console.log('Comandos especiais:');
  // console.log('  /novo - Reinicia a conversa');
  // console.log('  /pausa - Mostra status da pausa');
  // console.log('  /sair - Encerra o teste\n');
  
  showPauseStatus(chatId);

  rl.question('Você: ', async (input) => {
    // Comandos especiais
    if (input === '/sair') {
      console.log('Encerrando teste...');
      rl.close();
      return;
    }

    if (input === '/novo') {
      console.log('\n--- NOVA CONVERSA ---');
      return chatLoop(); // Reinicia com novo ID
    }

    if (input === '/pausa') {
      showPauseStatus(chatId);
      return chatLoop(chatId); // Continua mesma conversa
    }

    // Processa a mensagem normal
    const response = await processMessage(chatId, input);
    
    if (response) {
      console.log('\nBot:', response);
    } else if (isChatPaused(chatId)) {
      console.log('\nBot: [silêncio - chat pausado por 6 horas]');
    } else {
      console.log('\nBot: [sem resposta]');
    }

    // Mostra status após cada mensagem
    console.log('');
    showPauseStatus(chatId);
    
    // Continua o loop
    chatLoop(chatId);
  });
}

// Inicia o teste
chatLoop();

// Configuração para encerramento
rl.on('close', () => {
  console.log('Teste finalizado. Até mais!');
  process.exit(0);
});