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
                    <br><br>
                    <button onclick="location.reload()">Refresh QR</button>
                </body>
            </html>
        `);
    } catch (err) {
        res.send("Error render QR");
    }
});

// Web server
app.listen(3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING → http://127.0.0.1:3000");
});

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
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            latestQR = qr;
            console.log("QR READY");
        }

        if (connection === "open") {
            console.log("BOT CONNECTED");
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401;

            console.log("Connection closed");

            if (shouldReconnect) {
                console.log("Reconnecting...");
                setTimeout(() => startBot(), 3000);
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
