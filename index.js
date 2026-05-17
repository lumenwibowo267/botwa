const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {

        // 🔥 FIX PENTING: ambil qr dengan aman
        const qr = update.qr;
        const connection = update.connection;

        if (qr) {
            console.clear();
            console.log("SCAN QR DI WHATSAPP:\n");

            qrcode.generate(qr, {
                small: false
            });
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED");
        }

        if (connection === "close") {
            console.log("❌ CONNECTION CLOSED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
