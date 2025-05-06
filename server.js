const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "7990890271:AAFHGe2etMiRhZxaZj8JbcVHdPnBx-yHqB8";
const TELEGRAM_USER_ID = "7341190291"; 

const requestsFile = path.join(__dirname, "requests.json");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Tampilkan halaman form
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "form.html"));
});

// Handle request
app.post("/api/request", async (req, res) => {
    try {
        const { nama, pesan, waktu } = req.body;
        // Simpan dengan struktur yang kompatibel dengan sistem lama
        // tetapi tanpa perlu divisi dan prioritas dari user
        const divisi = "N/A"; // Default value since we removed the field
        const prioritas = "Normal"; // Default value since we removed the field
        const data = { nama, divisi, pesan, prioritas, waktu };

        let requests = [];
        if (fs.existsSync(requestsFile)) {
            const fileContent = fs.readFileSync(requestsFile, 'utf8');
            if (fileContent.trim()) {
                requests = JSON.parse(fileContent);
            }
        }
        requests.push(data);
        fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));

        // Format pesan untuk Telegram yang lebih sederhana
        const text = `📬 *REQUEST BARU*\n\n👤 *Nama:* ${nama}\n\n📝 *Pesan:*\n${pesan}\n\n⏰ *Waktu:* ${waktu}`;
        
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_USER_ID,
            text: text,
            parse_mode: "Markdown"
        });

        res.status(200).send({ success: true });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ success: false, error: "Terjadi kesalahan pada server" });
    }
});

// Endpoint Webhook dari Telegram
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const message = req.body.message;
        if (!message || !message.text) return res.sendStatus(200);

        const chatId = message.chat.id;
        const text = message.text;

        if (text === "/cekrequest") {
            let responseText = "📋 *DAFTAR REQUEST:*\n\n";

            if (fs.existsSync(requestsFile)) {
                const fileContent = fs.readFileSync(requestsFile, 'utf8');
                
                if (!fileContent.trim()) {
                    responseText = "Belum ada request yang masuk.";
                } else {
                    const requests = JSON.parse(fileContent);

                    if (requests.length === 0) {
                        responseText = "Belum ada request yang masuk.";
                    } else {
                        requests.forEach((item, index) => {
                            // Simplify the response format
                            responseText += `*${index + 1}.* ${item.nama}\n📝 *Pesan:* ${item.pesan}\n⏰ ${item.waktu}\n\n`;
                        });
                    }
                }
            } else {
                responseText = "File request tidak ditemukan.";
            }

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: responseText,
                parse_mode: "Markdown"
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Error in webhook:", error);
        res.sendStatus(500);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    
    // Pastikan file requests.json ada
    if (!fs.existsSync(requestsFile)) {
        fs.writeFileSync(requestsFile, JSON.stringify([], null, 2));
        console.log("File requests.json telah dibuat");
    }
});
