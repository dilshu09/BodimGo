import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ViewingRequest from './src/models/ViewingRequest.js';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

import fs from 'fs';

const debugViewings = async () => {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        await mongoose.connect(MONGO_URI);
        log("Connected to DB");

        const requests = await ViewingRequest.find({});
        log(`Found ${requests.length} viewing requests.`);

        requests.forEach(r => {
            log(`Req ID: ${r._id} | Provider: ${r.provider} | Listing: ${r.listing}`);
        });

        log("--- Providers ---");
        const providers = await User.find({ role: 'provider' });
        providers.forEach(p => {
            log(`Provider: ${p.name} | ID: ${p._id}`);
        });

        fs.writeFileSync('debug_output.txt', output);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
};

debugViewings();
