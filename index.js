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

// =======================
// WEB SERVER
// =======================
app.get("/", (req, res) => {

    if (!latestQR) {
        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="1">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>Menunggu QR WhatsApp...</h2>
            </body>
            </html>
        `);
    }

    qrcode.toDataURL(latestQR, (err, url) => {
        if (err) return res.send("QR ERROR");

        res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="3">
            </head>
            <body style="text-align:center">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${url}" width="300"/>
            </body>
            </html>
        `);
    });
});

// =======================
// SERVER START
// =======================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// =======================
// BOT START
// =======================
async function startBot() {

    console.log("STARTING BOT...");

    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ["BotWA", "Chrome", "1.0.0"]
    });

    // =======================
    // 🔥 FIX QR YANG BENAR
    // =======================
    sock.ev.on("connection.update", (update) => {

        const { connection, qr } = update;

        // ✔ INI QR YANG VALID
        if (qr && typeof qr === "string" && qr.length > 200) {
            latestQR = qr;
            console.log("QR REAL RECEIVED:", qr.length);
        }

        if (connection === "open") {
            console.log("CONNECTED");
            latestQR = null;
        }

        if (connection === "close") {
            console.log("DISCONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
