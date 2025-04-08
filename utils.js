const { client } = require("./whatsapp_bot");

// Função para enviar mensagens
function sendMessage(chatId, message) {
  return client.sendMessage(chatId, message);
}

module.exports = {
  sendMessage,
};