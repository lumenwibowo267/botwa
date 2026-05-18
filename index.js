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
                <meta http-equiv="refresh" content="1">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>QR belum tersedia</h2>
                <p>Menunggu QR WhatsApp...</p>
            </body>
            </html>
        `);
    }

    try {
        const qrImage = await qrcode.toDataURL(latestQR);

        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="3">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${qrImage}" width="300"/>
                <p>Refresh otomatis setiap 3 detik</p>
            </body>
            </html>
        `);

    } catch (err) {
        console.log("QR ERROR:", err);
        return res.send("<h2>QR render error</h2>");
    }
});

// =======================
// START SERVER
// =======================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// =======================
// BOT WHATSAPP
// =======================
async function startBot() {
    console.log("STARTING BOT...");

    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ["BotWA", "Chrome", "1.0.0"]
    });

    // =======================
    // CONNECTION HANDLER
    // =======================
    sock.ev.on("connection.update", (update) => {

        const { connection } = update;

        // ✅ QR HANDLER (FIX UTAMA)
        if (update.qr) {
            latestQR = update.qr;
            console.log("QR RECEIVED:", update.qr.length);
        }

        // CONNECTED
        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null;
        }

        // RECONNECT LOGIC
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

// =======================
// START BOT
// =======================
startBot();

// =======================
// DEBUG QR STATUS
// =======================
setInterval(() => {
    console.log("QR STATUS:", latestQR ? latestQR.length : "NULL");
}, 3000);
