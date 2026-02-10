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
                        content: `You are a Strict Content Filter for a Real Estate Platform.
                        Your ONLY job is to block images that are not high-quality photos of a property (Interior/Exterior).

                        **STRICT REJECTION RULES:**
                        1. **ANIMALS/PETS**: If the image contains a Dog, Cat, or any animal -> REJECT immediately. Reason: "Pet photos are strictly prohibited".
                        2. **PEOPLE**: If the image contains clear faces -> REJECT.
                        3. **NON-PROPERTY**: Food, Cars, Selfies, Memes, Screenshots, Blurry blobs -> REJECT.
                        4. **TEXT**: Heavy watermarks or promotional text -> REJECT.

                        If the image is a nice room/house BUT has a dog in it -> REJECT IT.
                        
                        Return JSON:
                        {
                            "isAllowed": boolean,
                            "reason": "Reason for rejection (e.g. Contains Animal)",
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
