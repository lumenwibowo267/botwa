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

    let img;

    try {
        img = await qrcode.toDataURL(qr);
    } catch (err) {
        console.log("QR RENDER ERROR:", err);
        return res.send("<h2>QR ERROR</h2>");
    }

    return res.send(`
        <html>
        <head>
            <meta http-equiv="refresh" content="3">
        </head>
        <body style="text-align:center;font-family:Arial">
            <h2>SCAN QR WHATSAPP</h2>
            <img src="${img}" width="300"/>
            <p>Refresh otomatis</p>
        </body>
        </html>
    `);
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

        // RECONNECT (lebih aman daripada restart langsung)
        if (connection === "close") {
            const shouldReconnect =
                update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

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
// DEBUG QR STATUS (opsional)
// =======================
setInterval(() => {
    console.log("WEB QR CHECK:", latestQR ? latestQR.length : "NULL");
}, 3000);
