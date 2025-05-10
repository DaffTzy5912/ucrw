const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "7990890271:AAFHGe2etMiRhZxaZj8JbcVHdPnBx-yHqB8";
const TELEGRAM_USER_ID = "7341190291";

const absensiFile = path.join(__dirname, "absensi.json");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // untuk webhook Telegram

// Tampilkan halaman form & kirim notifikasi kunjungan
app.get("/", async (req, res) => {
  const visitorIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];

  const text = `Ada yang mengunjungi website absensi kamu!\nIP: ${visitorIP}\nBrowser: ${userAgent}`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_USER_ID,
      text,
    });
  } catch (error) {
    console.error("Gagal kirim notifikasi Telegram:", error.message);
  }

  res.sendFile(path.join(__dirname, "form.html"));
});

// Handle form absensi
app.post("/api/absen", async (req, res) => {
  const { nama, umur, kelas, waktu } = req.body;
  const data = { nama, umur, kelas, waktu };

  let list = [];
  if (fs.existsSync(absensiFile)) {
    list = JSON.parse(fs.readFileSync(absensiFile));
  }
  list.push(data);
  fs.writeFileSync(absensiFile, JSON.stringify(list, null, 2));

  const text = `Woi Bang Ada Yang Absen Nih:\nNama: ${nama}\nUmur: ${umur}\nKelas: ${kelas}\nWaktu: ${waktu}`;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_USER_ID,
      text,
    });
  } catch (error) {
    console.error("Gagal kirim absensi ke Telegram:", error.message);
  }

  res.send(`<p>Absensi berhasil dikirim!</p><a href="/">Kembali</a>`);
});

// Webhook untuk cek absensi dari Telegram
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

  if (text === "/cekabsen") {
    let responseText = "Daftar Absensi:\n\n";

    if (fs.existsSync(absensiFile)) {
      const list = JSON.parse(fs.readFileSync(absensiFile));

      if (list.length === 0) {
        responseText = "Belum ada data absensi.";
      } else {
        list.forEach((item, index) => {
          responseText += `${index + 1}. ${item.nama} | ${item.umur} th | ${item.kelas} | ${item.waktu}\n`;
        });
      }
    } else {
      responseText = "File absensi tidak ditemukan.";
    }

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: responseText,
    });
  }

  res.sendStatus(200);
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
