const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();

let latestQR = null;

// DEBUG biar yakin server hidup
app.get("/", async (req, res) => {
    if (!latestQR) {
        return res.send(`
            <h2>⏳ QR belum tersedia</h2>
            <p>Silakan tunggu bot generate QR...</p>
        `);
    }

    const img = await qrcode.toDataURL(latestQR);

    res.send(`
        <html>
        <body style="text-align:center;font-family:Arial;">
            <h2>SCAN QR WHATSAPP</h2>
            <img src="${img}" style="width:300px;height:300px"/>
            <p>Refresh jika QR tidak berubah</p>
        </body>
        </html>
    `);
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING");
});

async function startBot() {
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
            console.log("QR LENGTH:", latestQR?.length);
        }

        if (connection === "open") {
            console.log("✅ CONNECTED");
        }

        if (connection === "close") {
            console.log("❌ CLOSED");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
