const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/Admin/OneDrive/Desktop/Cipher/backend/.env' });

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'cipher_sandbox',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
});

async function testConnection() {
    try {
        console.log('Attempting to connect to Postgres...');
        console.log('Config:', {
            user: process.env.POSTGRES_USER,
            host: process.env.POSTGRES_HOST,
            database: process.env.POSTGRES_DB,
            port: process.env.POSTGRES_PORT
        });
        const client = await pool.connect();
        console.log('Successfully connected to Postgres!');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('Query result:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
