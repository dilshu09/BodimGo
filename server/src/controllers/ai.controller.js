import { runAgent } from '../ai/orchestrator.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// --- Text Validation Controller ---
export const validateText = async (req, res) => {
    try {
        const { text, field } = req.body; // field: 'title' or 'description'

        if (!text) return res.json({ isValid: true });

        // 1. Run Abusive/PII Check
        const abusiveCheck = runAgent('AbusiveWordsCheckAgent', {
            text,
            context: { userId: req.user?._id || new mongoose.Types.ObjectId() }
        }, {
            type: 'validation',
            id: new mongoose.Types.ObjectId()
        });

        // Legacy Regex (Backup)
        const phoneRegex = /(?:\\+94|0)?7[0-9]{8}/;
        const nicRegex = /[0-9]{9}[vVxX]|[0-9]{12}/;
        const regexPII = phoneRegex.test(text) || nicRegex.test(text);

        const checkResult = await abusiveCheck;

        const errors = [];

        // Abusive/Safety content
        if (checkResult.categories?.includes('abuse') || checkResult.categories?.includes('hate') || checkResult.categories?.includes('sexual')) {
            errors.push("Contains inappropriate or unsafe language.");
        }

        // PII Detection (AI + Regex)
        if (field === 'description' && (checkResult.pii_detected || checkResult.categories?.includes('pii_leak') || regexPII)) {
            errors.push("Phone numbers/PII are not allowed in the public description.");
        }

        // General blocking behavior
        if (errors.length === 0 && checkResult.action === 'block') {
            errors.push(checkResult.reason || "Content flagged by safety guidelines.");
        }

        res.json({
            isValid: errors.length === 0,
            errors
        });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Location Verification Controller ---
export const verifyLocation = async (req, res) => {
    try {
        const { province, district, city, address, coordinates } = req.body;

        // Basic Validation
        if (!province || !district || !city || !address) {
            return res.json({
                isValid: false,
                errors: { general: "All location fields are required." }
            });
        }

        const agentResult = await runAgent('AddressVerificationAgent', {
            province, district, city, address, coordinates
        }, {
            type: 'validation',
            id: new mongoose.Types.ObjectId()
        });

        res.json(agentResult);

    } catch (error) {
        console.error("Location Verify Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Image Validation Controller ---
// --- Image Validation Controller ---
export const validateImages = async (req, res) => {
    try {
        const { images } = req.body; // Array of image URLs or Base64 strings

        try {
            const debugMsg = `\n[ENTRY] Validating ${images?.length} images at ${new Date().toISOString()}\n`;
            fs.appendFileSync(path.join(process.cwd(), 'logs', 'ai_debug.log'), debugMsg);
        } catch (e) { console.error("Log Error", e); }

        if (!images || !Array.isArray(images) || images.length === 0) {
            try {
                fs.appendFileSync(path.join(process.cwd(), 'logs', 'ai_debug.log'), `[EXIT] No images provided. Returning valid.\n`);
            } catch (e) { }
            return res.json({ isValid: true, flaggedImages: [] });
        }

        const flaggedImages = [];

        // Run in parallel
        const checks = images.map(async (img) => {
            try {
                let base64 = '';
                const debugImgSnippet = img.substring(0, 100);
                try {
                    fs.appendFileSync(path.join(process.cwd(), 'logs', 'ai_debug.log'), `[PROCESS] Processing image: ${debugImgSnippet}...\n`);
                } catch (e) { }

                // Case A: Base64 String
                if (img.startsWith('data:image')) {
                    // Remove header (e.g., "data:image/jpeg;base64,")
                    base64 = img.split(',')[1];
                }
                // Case B: Local File URL (Legacy support for Wizard)
                else if (img.includes('/uploads/')) {
                    const filename = img.split('/').pop();
                    const filePath = path.join(process.cwd(), 'uploads', filename);
                    if (fs.existsSync(filePath)) {
                        const bitmap = fs.readFileSync(filePath);
                        base64 = bitmap.toString('base64');
                    }
                }
                // Case C: Remote URL (Cloudinary etc) - FETCH IT!
                else if (img.startsWith('http')) {
                    try {
                        const response = await fetch(img);
                        const arrayBuffer = await response.arrayBuffer();
                        base64 = Buffer.from(arrayBuffer).toString('base64');
                    } catch (fetchErr) {
                        console.error("Failed to fetch remote image:", fetchErr);
                    }
                }

                if (base64) {
                    const result = await runAgent('ImageModerationAgent', {
                        imageBase64: base64,
                        imageId: img.substring(0, 30) + '...' // Log snippet
                    }, { type: 'validation', id: new mongoose.Types.ObjectId() });

                    if (!result.isAllowed) {
                        return { url: img, reason: result.reason, category: result.category };
                    }
                }
                return null;
            } catch (innerErr) {
                console.error("Image Process Error:", innerErr);
                return null;
            }
        });

        const results = await Promise.all(checks);
        const failures = results.filter(r => r !== null);

        try {
            const resultMsg = `\n[RESULT] Flagged: ${failures.length}\nFailures: ${JSON.stringify(failures, null, 2)}\nFull Results: ${JSON.stringify(results, null, 2)}\n--------------------------------------------------\n`;
            fs.appendFileSync(path.join(process.cwd(), 'logs', 'ai_debug.log'), resultMsg);
        } catch (e) { console.error("Log Error", e); }

        res.json({
            isValid: failures.length === 0,
            flaggedImages: failures
        });

    } catch (error) {
        console.error("Image Verify Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Agreement Generation Controller ---
export const generateAgreement = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const agentResult = await runAgent('AgreementGeneratorAgent', { prompt }, {
            type: 'generation',
            id: req.user?._id || new mongoose.Types.ObjectId()
        });

        res.json({ success: true, text: agentResult.text });

    } catch (error) {
        console.error("Agreement Gen Error:", error);
        res.status(500).json({ message: error.message });
    }
};
