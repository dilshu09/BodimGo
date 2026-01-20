import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Configure
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Uploads a local file to Cloudinary and deletes the local copy
 * @param {string} localUrl - Full URL e.g. http://localhost:5000/uploads/img.jpg
 * @returns {Promise<string>} Cloudinary Secure URL
 */
export const uploadToCloudinary = async (localUrl) => {
    try {
        if (!localUrl || typeof localUrl !== 'string') return localUrl;
        if (localUrl.includes('cloudinary.com')) return localUrl; // Already uploaded

        // Sanity Check Credentials
        if (!process.env.CLOUDINARY_CLOUD_NAME || 
             process.env.CLOUDINARY_CLOUD_NAME === 'demo' || 
             !process.env.CLOUDINARY_API_KEY) {
             throw new Error("Invalid or Missing Cloudinary Credentials in .env");
        }

        // Extract filename from URL
        const filename = localUrl.split('/').pop();
        if (!filename) return localUrl;

        // Construct absolute path using __dirname (more robust)
        // src/utils/../../uploads -> server/uploads
        const filePath = path.resolve(__dirname, '../../uploads', filename);

        console.log(`[Cloudinary] Processing file: ${filename}`);
        console.log(`[Cloudinary] Resolved Path: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            // Check fallback for src/uploads
            const fallbackPath = path.resolve(__dirname, '../../src/uploads', filename);
            if(fs.existsSync(fallbackPath)) {
                 // Found in src/uploads
                 console.log(`[Cloudinary] Found at fallback: ${fallbackPath}`);
                 const result = await cloudinary.uploader.upload(fallbackPath, {
                    folder: 'bodimgo_listings',
                    resource_type: 'auto'
                });
                try { fs.unlinkSync(fallbackPath); } catch (e) {}
                return result.secure_url;
            }

            console.error(`[Cloudinary] File NOT found at: ${filePath}`);
            throw new Error(`File not found on server: ${filename}`);
        }

        // Upload
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'bodimgo_listings',
            resource_type: 'auto'
        });

        // Delete local file to save space
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error("Failed to delete local file:", err);
        }

        return result.secure_url;

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        // THROW to fail the request, so user knows it failed!
        throw new Error(`Cloudinary Upload Failed: ${error.message}`);
    }
};
