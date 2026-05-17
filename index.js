const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();

let latestQR = null;

// Web QR
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send("<h2>QR belum tersedia...</h2>");
    }

    const qrImage = await qrcode.toDataURL(latestQR);

    res.send(`
        <html>
            <body style="text-align:center">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${qrImage}" width="300"/>
            </body>
        </html>
    `);
});

// Start web
app.listen(3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

// WhatsApp bot
async function startBot() {
    const { state, saveCreds } =
        await useMultiFileAuthState("./auth");

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", (update) => {
        const { qr, connection } = update;

        if (qr) {
            latestQR = qr;
            console.log("QR READY");
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
