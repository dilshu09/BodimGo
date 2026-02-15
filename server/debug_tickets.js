
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkTickets = async () => {
    await connectDB();

    // Use relative path from server root
    const Ticket = (await import('./src/models/Ticket.js')).default;

    const tickets = await Ticket.find({}).sort({ createdAt: -1 }).limit(5);

    console.log('--- Recent 5 Tickets ---');
    tickets.forEach(t => {
        console.log(`ID: ${t._id}`);
        console.log(`Subject: ${t.subject}`);
        console.log(`Status: '${t.status}'`);
        console.log(`Source: '${t.source}'`);
        console.log(`AdminResponse: ${t.adminResponse ? t.adminResponse.substring(0, 20) + '...' : 'No'}`);
        console.log('------------------------');
    });

    process.exit();
};

checkTickets();
