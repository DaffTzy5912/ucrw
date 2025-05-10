const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "8160121155:AAGYo5YFLZUqi1jq6nwzY6XOGzH8cTzVJJ0";
const TELEGRAM_USER_ID = "7341190291"; // ganti dengan chat_id kamu

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // untuk akses index.html dan assets lainnya

// Tampilkan halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle form screenshot
app.post("/api/screenshot", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("URL kosong");

  const apiScreenshotUrl = `https://api.ownblox.biz.id/api/ssweb?url=${encodeURIComponent(url)}`;

  try {
    // Ambil gambar sebagai buffer
    const response = await axios.get(apiScreenshotUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // Siapkan form-data
    const form = new FormData();
    form.append("chat_id", TELEGRAM_USER_ID);
    form.append("photo", buffer, "screenshot.jpg");

    // Kirim ke Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, form, {
      headers: form.getHeaders(),
    });

    res.send("Screenshot berhasil dikirim ke Telegram!");
  } catch (err) {
    console.error("Gagal mengirim screenshot:", err.message);
    res.status(500).send("Gagal mengirim screenshot ke Telegram.");
  }
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
