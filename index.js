const express = require("express");
const qrcode = require("qrcode");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

// 🔥 PENTING: selalu ambil QR terbaru saat request
app.get("/", async (req, res) => {
    console.log("WEB OPENED");

    if (!latestQR) {
        return res.send(`
            <h2>QR belum tersedia</h2>
            <p>Tunggu bot generate QR...</p>
        `);
    }

    try {
        const img = await qrcode.toDataURL(latestQR);

        return res.send(`
            <html>
            <body style="text-align:center;font-family:Arial;">
                <h2>SCAN QR WHATSAPP</h2>
                <img src="${img}" width="300" />
                <p>Refresh jika QR belum muncul</p>
            </body>
            </html>
        `);
    } catch (err) {
        return res.send("Error render QR");
    }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("SERVER RUNNING http://localhost:3000");
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
    const { qr } = update;

    if (qr) {
        latestQR = qr;
        console.log("QR UPDATED → WEB READY");
        console.log("QR LENGTH:", qr.length);
    }
});

    sock.ev.on("creds.update", saveCreds);
}

startBot();
