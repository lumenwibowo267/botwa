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
        return res.send(`
            <html>
            <body style="text-align:center">
                <h2>QR belum tersedia...</h2>
                <script>
                    setTimeout(()=>location.reload(), 2000)
                </script>
            </body>
            </html>
        `);
    }

    const qrImage = await qrcode.toDataURL(latestQR);

    res.send(`
        <html>
        <body style="text-align:center">
            <h2>SCAN QR</h2>
            <img src="${qrImage}" width="300"/>
        </body>
        </html>
    `);
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
    printQRInTerminal: true,
    browser: ["Bot", "Chrome", "1.0.0"]
});

    sock.ev.on("connection.update", (update) => {
    console.log("STATE:", update.connection);

    const qr = update.qr || update?.connectionUpdate?.qr;

    if (qr) {
        latestQR = qr;
        console.log("QR SAVED:", qr.length);
    }

    if (update.connection === "open") {
        console.log("CONNECTED SUCCESS");
    }
});

    sock.ev.on("creds.update", saveCreds);
}

startBot();
