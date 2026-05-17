console.log("🚀 BOT STARTED:", new Date().toISOString());
const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();
let latestQR = null;

// WEB SERVER QR
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send("<h2>QR belum muncul, tunggu bot...</h2>");
    }

    const img = await qrcode.toDataURL(latestQR);

    res.send(`
        <h1>Scan QR WhatsApp</h1>
        <img src="${img}" />
    `);
});

app.listen(3000, () => {
    console.log("🌐 Buka QR di: http://localhost:3000");
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
            console.log("QR updated → buka http://localhost:3000");
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
