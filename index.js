const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false // penting: harus false
    });

 const qrcode = require("qrcode-terminal");

sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
        console.log("\nSCAN QR INI DI WHATSAPP:\n");
        qrcode.generate(qr, { small: false });
    }

    if (connection === "open") {
        console.log("BOT CONNECTED");
    }
});

    sock.ev.on("creds.update", saveCreds);
}

startBot();
