const express = require('express');
const { createClient } = require('redis');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối Redis của Railway (Tự động lấy biến môi trường)
const client = createClient({ url: process.env.REDIS_URL });
client.on('error', err => console.log('Redis Error', err));
client.connect();

// API Lưu và Kiểm tra Lì Xì
app.post('/api/lixi', async (req, res) => {
    const { name, amount } = req.body;
    const id = name.toLowerCase().replace(/\s+/g, '');

    // Kiểm tra xem ID này đã tồn tại chưa
    const userExists = await client.hGet('lixi_users', id);
    if (userExists) {
        return res.json({ status: 'exists', data: JSON.parse(userExists) });
    }

    // Nếu chưa, lưu mới vào Database
    const newData = { name, amount, time: new Date().toLocaleTimeString() };
    await client.hSet('lixi_users', id, JSON.stringify(newData));
    await client.lPush('lixi_history', JSON.stringify(newData));
    
    res.json({ status: 'success', data: newData });
});

// API Lấy lịch sử
app.get('/api/history', async (req, res) => {
    const history = await client.lRange('lixi_history', 0, 9);
    res.json(history.map(item => JSON.parse(item)));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại cổng ${PORT}`));
