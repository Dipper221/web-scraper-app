const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем CORS и отдаем статические файлы из папки public
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 1. База данных (Ключевое слово -> Список URL)
const DATABASE = {
    "js": [
        "https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js",
        "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"
    ],
    "text": [
        "https://www.w3.org/TR/PNG/iso_8859-1.txt",
        "https://raw.githubusercontent.com/microsoft/TypeScript/main/LICENSE.txt"
    ],
    "html": [
        "https://httpbin.org/html",
        "https://example.com/"
    ]
};

// 2. API: Поиск URL по ключевому слову
app.get('/api/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    
    if (DATABASE[query]) {
        res.json({ success: true, urls: DATABASE[query] });
    } else {
        res.json({ success: false, message: 'По данному запросу ничего не найдено', urls: [] });
    }
});

// 3. API: Прокси для скачивания контента
app.get('/api/fetch', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        console.log(`Скачиваю: ${targetUrl}`);
        
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream', // Важно для потоковой передачи
            headers: { 'User-Agent': 'NodeScraper/1.0' }
        });

        // Получаем размер контента от удаленного сервера
        const totalLength = response.headers['content-length'];

        // Передаем заголовки клиенту
        if (totalLength) {
            res.setHeader('Content-Length', totalLength);
        }
        res.setHeader('Content-Type', response.headers['content-type'] || 'text/plain');

        // Переливаем данные из axios прямо в ответ клиенту (pipe)
        response.data.pipe(res);

    } catch (error) {
        console.error('Ошибка прокси:', error.message);
        res.status(502).send(`Ошибка при скачивании: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});