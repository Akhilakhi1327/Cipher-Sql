const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT),
    ssl: false,
});

pool.connect()
    .then(() => {
        console.log("Connected to PostgreSQL (Sandbox DB)");
    })
    .catch((err) => {
        console.error("PostgreSQL connection failed:", err.message);
    });

pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;