const express = require("express");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();

let latestQR = null;

// =======================
// WEB
// =======================
app.get("/", (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    if (!latestQR) {
        return res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="1">
            </head>
            <body style="text-align:center;font-family:Arial">
                <h2>QR belum tersedia...</h2>
                <p>Menunggu WhatsApp QR...</p>
            </body>
            </html>
        `);
    }

    // 🔥 langsung render QR tanpa qrcode.toDataURL
    return res.send(`
        <html>
        <body style="text-align:center;font-family:Arial">
            <h2>SCAN QR WHATSAPP</h2>
            <img src="${latestQR}" style="width:300px"/>
            <p>Refresh otomatis</p>
        </body>
        </html>
    `);
});

// =======================
// SERVER
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
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            latestQR = qr; // 🔥 SIMPAN RAW QR
            console.log("QR UPDATED (READY)");
        }

        if (connection === "open") {
            console.log("CONNECTED");
            latestQR = null;
        }

        if (connection === "close") {
            const code = update.lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                setTimeout(startBot, 3000);
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();

console.log("QR LENGTH:", latestQR?.length);
