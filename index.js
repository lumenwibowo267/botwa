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

    // 🔥 anti-cache penting
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const qr = latestQR;

    if (!qr) {
        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="1">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>QR belum tersedia...</h2>
                <p>Auto refresh tiap 1 detik</p>
            </body>
            </html>
        `);
    }

    try {
        const img = await qrcode.toDataURL(qr);

        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="3">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${img}" width="300"/>
                <p>Auto refresh 3 detik</p>
            </body>
            </html>
        `);

    } catch (err) {
        console.log("QR RENDER ERROR:", err);
        return res.send("<h2>QR ERROR</h2>");
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

    const { state, saveCreds } =
        await useMultiFileAuthState("./auth");

    const { version } =
        await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        // 🔥 QR UPDATE
        if (qr) {
            latestQR = qr;
            console.log("QR UPDATED (READY FOR WEB)");
        }

        // CONNECTED
        if (connection === "open") {
            console.log("CONNECTED TO WHATSAPP");
            latestQR = null;
        }

        // RECONNECT SAFE VERSION
        if (connection === "close") {
            const code = update.lastDisconnect?.error?.output?.statusCode;

            const shouldReconnect = code !== DisconnectReason.loggedOut;

            console.log("CONNECTION CLOSED, CODE:", code);

            if (shouldReconnect) {
                setTimeout(() => {
                    startBot();
                }, 3000); // 🔥 biar tidak spam reconnect
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();

// =======================
// DEBUG QR STATUS
// =======================
setInterval(() => {
    console.log("QR STATUS:", latestQR ? "AVAILABLE" : "NULL");
}, 3000);
