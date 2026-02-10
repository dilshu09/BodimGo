
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import fs from 'fs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bodimgo";

mongoose.connect(MONGO_URI)
    .then(async () => {
        try {
            const idsToCheck = [
                "6978836a05edf986e749f8f0", // From logs (reconstructed)
                "696dbdba6d6e1b7ec3419f20"  // User "sewwandi" from debug_output.txt
            ];

            let output = "";

            for (const id of idsToCheck) {
                // IDs might be fake/custom if they don't look like standard hex
                if (mongoose.Types.ObjectId.isValid(id)) {
                    const user = await User.findById(id);
                    if (user) {
                        output += `User Found (${id}): ${user.name} | Role: '${user.role}'\n`;
                    } else {
                        output += `User Not Found (${id})\n`;
                    }
                } else {
                    output += `Invalid ID format (${id})\n`;
                }
            }

            fs.writeFileSync('user_roles_check.txt', output);
        } catch (e) {
            console.error(e);
            fs.writeFileSync('user_roles_check.txt', 'Error: ' + e.message);
        } finally {
            mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
