const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();

let latestQR = null;
let sockInstance;

// =======================
// WEB SERVER QR
// =======================
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="2">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>QR belum tersedia...</h2>
                <p>Menunggu QR dari WhatsApp...</p>
            </body>
            </html>
        `);
    }

    try {
        const img = await qrcode.toDataURL(latestQR);

        return res.send(`
            <html>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${img}" width="300"/>
            </body>
            </html>
        `);
    } catch (e) {
        return res.send("Gagal render QR");
    }
});

// penting untuk Railway / hosting
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// =======================
// BOT WHATSAPP
// =======================
async function startBot() {
    console.log("STARTING BOT...");

    const { state, saveCreds } =
        await useMultiFileAuthState("./auth");

    const { version } =
        await fetchLatestBaileysVersion();

    sockInstance = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    // 🔥 QR HANDLER YANG BENAR
    sockInstance.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log("QR UPDATED (WEB READY)");
        }

        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null; // clear QR setelah login
        }

        if (connection === "close") {
            console.log("CONNECTION CLOSED → RESTART");
            startBot();
        }
    });

    sockInstance.ev.on("creds.update", saveCreds);
}

startBot();
