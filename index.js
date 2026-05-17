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
        const { connection, qr } = update;

        // 🔥 INI BAGIAN PENTING
        if (qr) {
            console.clear();
            console.log("\n=== SCAN QR DI WHATSAPP ===\n");

            qrcode.generate(qr, {
                small: false   // jangan small biar tidak rusak
            });
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }

        if (connection === "close") {
            console.log("CONNECTION CLOSED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
