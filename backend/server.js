require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectMongoDB = require('./config/mongodb');
const pool = require('./config/postgres');

const assignmentRoutes = require('./routes/assignmentRoutes');

connectMongoDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/assignments', assignmentRoutes);

app.get('/pg-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1');
        res.json(result.rows);
    } catch (err) {
        console.error("pg db oops:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});