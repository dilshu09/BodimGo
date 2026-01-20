import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';

let openai;

const getOpenAIClient = () => {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

export class ImageModerationAgent extends AIAgent {
    constructor() {
        super('ImageModerationAgent');
    }

    async execute(input) {
        const { imageBase64, imageId } = input;
        
        try {
            const client = getOpenAIClient();
            const response = await client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a Real Estate Photo Moderator.
                        Analyze the image. It MUST be a relevant property photo (Room, House, Bathroom, Kitchen, Exterior, Garden etc).
                        
                        **Rejection Criteria:**
                        1. Inappropriate/NSFW/Nudity/Violence (Strict Block).
                        2. People/Faces (Privacy concern - unless huge crowd).
                        3. Text/Watermarks (Heavy promotional text).
                        4. Not a Property (e.g. Smoothie, Landscape, Car, Selfie, Random Object).
                        5. Low Quality/Blurry (Severe).

                        Return JSON:
                        {
                            "isAllowed": boolean,
                            "reason": "Reason for rejection if any",
                            "category": "safe" | "nsfw" | "irrelevant" | "low_quality" | "privacy"
                        }`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Verify this image for a property listing." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                        ]
                    }
                ],
                max_tokens: 300,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            return {
                imageId,
                ...result
            };

        } catch (error) {
            console.error("Image Agent Error:", error);
            return { imageId, isAllowed: true, error: "AI Failed" }; // Fail open or closed? Lets fail open for now to avoid blockers
        }
    }
}
