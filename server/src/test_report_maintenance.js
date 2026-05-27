import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { reportMaintenance } from './controllers/tenant.controller.js';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodimgo';

async function run() {
    try {
        await mongoose.connect(mongoUri, { family: 4 });
        console.log('Connected to DB');

        // Create mock request and response
        const req = {
            body: {
                issue: 'Test leak in the ceiling fan or washer',
                priority: 'High'
            },
            user: {
                email: 'sandeepachamindu20050624@gmail.com',
                _id: new mongoose.Types.ObjectId() // Mock user ID
            },
            app: {
                get(key) {
                    if (key === 'socketio') return null;
                    return null;
                }
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                console.log(`\n--- Response (Status ${this.statusCode}) ---`);
                console.log(JSON.stringify(data, null, 2));
            }
        };

        console.log('Invoking reportMaintenance controller...');
        await reportMaintenance(req, res);

    } catch (error) {
        console.error('Unhandled Error in script:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
