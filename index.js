const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();

let latestQR = null;

// DEBUG biar yakin server hidup
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send(`
            <h2>QR belum ready</h2>
            <p>Refresh halaman setelah bot jalan</p>
        `);
    }

    const img = await qrcode.toDataURL(latestQR);

    return res.send(`
        <h1>SCAN QR WHATSAPP</h1>
        <img src="${img}" />
    `);
});

app.listen(3000, () => {
    console.log("🌐 SERVER OK http://localhost:3000");
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
            console.log("QR SAVED (web ready)");
        }

        if (connection === "open") {
            console.log("✅ CONNECTED");
        }

        if (connection === "close") {
            console.log("❌ CLOSED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
