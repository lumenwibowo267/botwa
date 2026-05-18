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
    try {
        if (!latestQR) {
            return res.send("<h2>QR belum tersedia... refresh lagi</h2>");
        }

        const qrImage = await qrcode.toDataURL(latestQR);

        res.send(`
            <html>
                <body style="text-align:center;font-family:Arial">
                    <h2>SCAN QR :contentReference[oaicite:0]{index=0}</h2>
                    <img src="${qrImage}" width="300"/>
                </body>
            </html>
        `);
    } catch (err) {
        res.send("Gagal render QR");
    }
});

// Start web server
app.listen(3000, () => {
    console.log("SERVER RUNNING → http://127.0.0.1:3000");
});

// Start bot
async function startBot() {
    console.log("STARTING BOT...");

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
        console.log("UPDATE:", update.connection);

        const { connection, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log("QR READY");
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }

        if (connection === "close") {
            console.log("BOT DISCONNECTED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
