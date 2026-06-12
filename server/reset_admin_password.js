import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import User from './src/models/User.js';

dns.setServers(['8.8.8.8']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI, { family: 4 })
    .then(async () => {
        try {
            const user = await User.findOne({ email: 'sandeepachamindu20050624@gmail.com' });
            if (user) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash('admin123', salt);
                user.isVerified = true;
                user.role = 'admin';
                await user.save();
                console.log(`Password reset successfully for ${user.email} to 'admin123'`);
            } else {
                console.log("Admin user not found in DB");
            }
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
