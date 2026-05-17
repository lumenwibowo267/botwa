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

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("\n=== SCAN QR DI BAWAH ===\n");
            console.log(qr);
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
