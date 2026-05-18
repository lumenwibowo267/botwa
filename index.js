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
// ENDPOINT QR (JSON DEBUG)
// =======================
app.get("/qr-data", (req, res) => {
    res.json({
        qr: latestQR,
        length: latestQR ? latestQR.length : 0
    });
});

// =======================
// WEB QR PAGE
// =======================
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send(`
            <h2>QR belum tersedia...</h2>
            <meta http-equiv="refresh" content="2">
        `);
    }

    const img = await qrcode.toDataURL(latestQR);

    res.send(`
        <html>
        <body style="text-align:center;font-family:Arial">
            <h2>SCAN QR WHATSAPP</h2>
            <img src="${img}" width="300"/>
            <p>Auto refresh 5 detik</p>
            <script>
                setTimeout(() => location.reload(), 5000);
            </script>
        </body>
        </html>
    `);
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
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log("QR RECEIVED:", qr.length);
        }

        if (connection === "open") {
            console.log("CONNECTED");
            latestQR = null;
        }

        if (connection === "close") {
            const shouldReconnect =
                update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("DISCONNECTED");

            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
