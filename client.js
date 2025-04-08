const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");


const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--max-old-space-size=256",
    ],
  },
});

// Exibe o QR Code para autenticação
client.on("qr", (qr) => {
  console.log("Escaneie o QR Code abaixo para autenticar:");
  qrcode.generate(qr, { small: true });
});

// Evento disparado quando o cliente é autenticado
client.on("authenticated", () => {
  console.log("Autenticado com sucesso!");
});

// Evento disparado quando o cliente está pronto para uso
client.on("ready", () => {
  console.log("Bot está pronto!");
});

// Inicia o cliente
client.initialize();

module.exports = client;