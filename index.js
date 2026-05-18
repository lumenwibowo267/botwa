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

    if (!latestQR || typeof latestQR !== "string") {
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
        if (err) {
            console.log("QR ERROR:", err);
            return res.send("<h2>QR ERROR</h2>");
        }

        res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="3">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${url}" width="300"/>
            </body>
            </html>
        `);
    });
});

// =======================
// START SERVER
// =======================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// =======================
// BOT
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
    // FIX QR (INI YANG BENAR)
    // =======================
    sock.ev.on("connection.update", (update) => {

        const { connection } = update;

        // 🔥 QR HARUS STRING VALID
        if (typeof update.qr === "string" && update.qr.length > 20) {
            latestQR = update.qr;
            console.log("QR VALID RECEIVED:", latestQR.length);
        }

        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null;
        }

        if (connection === "close") {
            console.log("DISCONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();

// =======================
// DEBUG
// =======================
setInterval(() => {
    console.log("QR TYPE:", typeof latestQR, "LENGTH:", latestQR?.length);
}, 3000);
