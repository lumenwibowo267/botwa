const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        console.log("MSG:", text);

        // MENU
        if (text === "!menu") {
            await sock.sendMessage(from, {
                text: "🤖 BOT ONLINE 24/7\n\n!play <judul> - cari lagu YouTube"
            });
        }

        // PLAY (link saja, aman)
        if (text.startsWith("!play ")) {
            const query = text.replace("!play ", "");
            const link = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

            await sock.sendMessage(from, {
                text: `🎵 Hasil pencarian:\n${link}`
            });
        }
    });
}

startBot();