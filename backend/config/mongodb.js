const mongoose = require('mongoose');

const connectMongoDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('MONGODB_URI is not defined. Skipping MongoDB connection (useful for sandbox testing without real DB).');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(' Connected to MongoDB (Persistence DB)');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
    }
};

module.exports = connectMongoDB;
