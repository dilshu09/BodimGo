import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const Tenant = (await import('./src/models/tenant.model.js')).default;
        const Listing = (await import('./src/models/Listing.js')).default;

        const tenantId = '697f2b3f9b2ddf1c34fdb6ab';
        console.log(`Looking for tenant ${tenantId}`);

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            console.log('Tenant not found!');
            return;
        }

        console.log(`Tenant listingId: ${tenant.listingId}, roomId: ${tenant.roomId}`);

        if (!tenant.listingId) {
            console.log('No listing ID');
            return;
        }

        const listing = await Listing.findById(tenant.listingId);
        if (!listing) {
            console.log('Listing not found');
            return;
        }

        console.log('Listing found:', listing.title);

        // Simulate the controller logic
        const room = listing.rooms.find(r => r._id.toString() === tenant.roomId || r.name === tenant.roomId);

        if (room) {
            console.log(`Found room: ${room.name}, status: ${room.status}`);
            room.status = 'Available';

            console.log('Attempting to save listing...');
            try {
                await listing.save();
                console.log('Listing saved successfully!');
            } catch (err) {
                console.error('SAVE FAILED!');
                console.error('Error name:', err.name);
                console.error('Error message:', err.message);
                if (err.errors) {
                    Object.keys(err.errors).forEach(key => {
                        console.error(`Field ${key}: ${err.errors[key].message}`);
                    });
                }
            }
        } else {
            console.log('Room not found in listing');
        }

    } catch (error) {
        console.error('CRASHED:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
