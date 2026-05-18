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
let sock;

// =======================
// WEB SERVER
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
        const qrImage = await qrcode.toDataURL(latestQR);

        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="5">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${qrImage}" width="300"/>
                <p>Refresh otomatis tiap 5 detik</p>
            </body>
            </html>
        `);
    } catch (err) {
        console.log("QR ERROR:", err);
        return res.send("<h2>QR ERROR</h2>");
    }
});

// =======================
// START SERVER
// =======================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// =======================
// WHATSAPP BOT
// =======================
async function startBot() {
    console.log("STARTING BOT...");

    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        // 🔥 QR RECEIVED (INI YANG BENAR)
        if (qr) {
            latestQR = qr;
            console.log("QR RECEIVED:", qr.length);
        }

        // CONNECTED
        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null;
        }

        // DISCONNECT HANDLING
        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;

            console.log("CONNECTION CLOSED");

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();

// =======================
// DEBUG (opsional)
// =======================
setInterval(() => {
    console.log("QR STATUS:", latestQR ? latestQR.length : "NULL");
}, 5000);
