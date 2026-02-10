import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        // Sanitize filename to avoid issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

import { uploadToCloudinary } from '../utils/cloudinary.js';

export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Construct dynamic URL based on server request for local reference
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const localUrl = `${baseUrl}/uploads/${req.file.filename}`;

        // Upload to Cloudinary
        // The utility expects a full URL or path, but let's check what it expects.
        // Reading cloudinary.js: "Uploads a local file ... takes localUrl"
        // It slices the filename from localUrl and finds it in uploads folder.

        const cloudinaryUrl = await uploadToCloudinary(localUrl);

        res.json({ url: cloudinaryUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).send("Failed to upload image");
    }
};
