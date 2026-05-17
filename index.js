const express = require("express");
const qrcode = require("qrcode");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();
let latestQR = null;

app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send("<h2>QR belum muncul, tunggu bot jalan...</h2>");
    }

    const qrImage = await qrcode.toDataURL(latestQR);

    res.send(`
        <h2>Scan QR WhatsApp</h2>
        <img src="${qrImage}" />
    `);
});

app.listen(3000, () => {
    console.log("🌐 QR Web running: http://localhost:3000");
});

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

        if (qr) {
            latestQR = qr;
            console.log("QR updated (open http://localhost:3000)");
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
