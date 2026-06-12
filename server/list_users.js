import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './src/models/User.js';

dns.setServers(['8.8.8.8']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI, { family: 4 })
    .then(async () => {
        try {
            const users = await User.find({});
            console.log("USERS IN DB:");
            users.forEach(u => {
                console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
            });
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
