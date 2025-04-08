const client = require("./client");
const { processMessage } = require("./bot_core");

// Evento para mensagens recebidas
client.on("message", async (message) => {
  const chatId = message.from; // ID do chat
  const isGroup = message.from.endsWith("@g.us"); // Verifica se é um grupo

  // Ignora mensagens de grupos
  if (isGroup) return;

  // Processa a mensagem
  const response = await processMessage(chatId, message.body);

  // Envia a resposta, se houver
  if (response) {
    client.sendMessage(chatId, response);
  }
});

// Trata o encerramento do processo
process.on("SIGINT", () => {
  console.log("\nEncerrando o bot...");
  process.exit(0);
});