const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("\nQR CODE LINK (OPEN IN BROWSER):");

            const url = await qrcode.toDataURL(qr);
            console.log(url);
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
