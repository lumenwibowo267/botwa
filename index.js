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
                <h2>QR belum tersedia</h2>
                <p>Menunggu QR dari WhatsApp...</p>
            </body>
            </html>
        `);
    }

    try {
        const img = await qrcode.toDataURL(latestQR);

        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="5">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${img}" width="300"/>
            </body>
            </html>
        `);

    } catch (err) {
        console.log("QR ERROR:", err);
        return res.send("<h2>QR render error</h2>");
    }
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

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("connection.update", (update) => {

        const { connection, qr } = update;

        // ✅ INI YANG BENAR UNTUK QR
        if (qr) {
            latestQR = qr;
            console.log("QR RECEIVED:", qr.length);
        }

        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null;
        }

        if (connection === "close") {
            const shouldReconnect =
                update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("CONNECTION CLOSED");

            if (shouldReconnect) {
                setTimeout(startBot, 3000);
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
