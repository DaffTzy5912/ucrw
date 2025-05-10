const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "8160121155:AAGYo5YFLZUqi1jq6nwzY6XOGzH8cTzVJJ0";
const TELEGRAM_USER_ID = "7341190291";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Tampilkan halaman HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint kirim screenshot ke Telegram
app.post("/api/screenshot", async (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).send("URL tidak ditemukan.");

    const imageUrl = `https://api.ownblox.biz.id/api/ssweb?url=${encodeURIComponent(url)}`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            chat_id: TELEGRAM_USER_ID,
            photo: imageUrl,
            caption: `Screenshot dari: ${url}`
        });

        res.send(`<p>Screenshot berhasil dikirim ke Telegram!</p><a href="/">Kembali</a>`);
    } catch (error) {
        console.error("Gagal kirim ke Telegram:", error.message);
        res.status(500).send("Gagal mengirim screenshot ke Telegram.");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});
