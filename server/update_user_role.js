
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI)
    .then(async () => {
        try {
            const user = await User.findById("6978836a05edf986e749f8f0");
            if (user) {
                user.role = 'admin';
                await user.save();
                console.log(`Updated ${user.name} to ADMIN`);
            } else {
                console.log("User not found");
            }
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(e => console.error(e));
