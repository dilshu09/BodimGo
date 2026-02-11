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
        // Room model? Listing has embedded rooms?

        const tenantId = '697f2b3f9b2ddf1c34fdb6ab'; // ID from user logs
        console.log(`Looking for tenant ${tenantId}`);

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            console.log('Tenant not found!');
            return;
        }
        console.log('Tenant found:', tenant.name, tenant.status);
        console.log('Tenant details:', JSON.stringify(tenant, null, 2));

        const status = 'Moved Out';
        const movedOutDate = new Date();

        // Simulate logic
        if (status === 'Moved Out') {
            console.log('Simulating Move Out logic...');
            tenant.movedOutDate = movedOutDate;

            if (tenant.roomId && tenant.roomId !== "Unassigned") {
                console.log(`Checking room ${tenant.roomId} for listing ${tenant.listingId}`);

                if (tenant.listingId) {
                    const listing = await Listing.findById(tenant.listingId);
                    if (listing) {
                        console.log('Listing found:', listing.title);
                        const room = listing.rooms.find(r => r._id.toString() === tenant.roomId || r.name === tenant.roomId);
                        if (room) {
                            console.log(`Found room ${room.name}, marking Available`);
                            room.status = 'Available';
                            // await listing.save(); // Don't save in debug, just check if code runs
                            console.log('Room update verified.');
                        } else {
                            console.log('Room not found in listing rooms:', listing.rooms.map(r => ({ id: r._id, name: r.name })));
                        }
                    } else {
                        console.log('Listing not found');
                    }
                } else {
                    console.log('Tenant has no listingId');
                }
            }
        }

        // Try saving tenant to check for schema errors
        // tenant.status = 'Moved Out';
        // await tenant.save(); // CAREFUL: This modifies DB. Maybe skip or use a transaction we abort? 
        // For 500 investigation, just reading and running logic is usually enough to find "Cannot read property of undefined" etc.

        console.log('Logic executed without crash.');

    } catch (error) {
        console.error('CRASHED:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
