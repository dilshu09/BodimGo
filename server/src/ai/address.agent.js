import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';

let openai;

const getOpenAIClient = () => {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

export class AddressVerificationAgent extends AIAgent {
    constructor() {
        super('AddressVerificationAgent');
    }

    async execute(input) {
        const { province, district, city, address, coordinates } = input;
        
        try {
            const client = getOpenAIClient();
            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a Location Verification Specialist for a Real Estate platform in Sri Lanka.
                        Your Goal: Verify consistency between structured selection, text address, and map coordinates.

                        **Logic Checks:**
                        1. **Hierarchy**: Does the City belong to the District/Province? (General knowledge).
                        2. **Text Match**: Does the "Full Address" text contain the City/Street suitable for that area?
                        3. **Geo Check (CRITICAL)**: 
                           - Check if the provided Latitude/Longitude pair (${coordinates?.lat}, ${coordinates?.lng}) implies a location inside or very near the selected City (${city}) and District (${district}).
                           - Use internal map knowledge.
                           - If the pin is > 5km away from the city center, return a "coordinates" error (Pin Mismatch).
                           - If coordinates are strictly 0,0 or default (6.9271,79.8612) BUT user claims a different city (e.g. Kandy), FLAG IT.

                        **Return JSON**:
                        {
                            "isValid": boolean, // False if any significant mismatch
                            "errors": {
                                "hierarchy": string | null, // e.g. "City X is not in District Y"
                                "addressText": string | null, // e.g. "Address text mentions Galle but City is Colombo"
                                "coordinates": string | null // e.g. "Pin location (Matara) does not match selected City (Galle)"
                            }
                        }`
                    },
                    {
                        role: "user",
                        content: JSON.stringify({ province, district, city, address, coordinates })
                    }
                ],
                model: "gpt-4o",
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content);
            
            // Clean up nulls for frontend
            Object.keys(result.errors || {}).forEach(key => {
                if (result.errors[key] === null) delete result.errors[key];
            });

            return result;

        } catch (error) {
            console.error("Address Agent Error:", error);
            // Fail open but log
            return { isValid: true, errors: {} };
        }
    }
}
