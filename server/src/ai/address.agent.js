import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';

let openai;

const getOpenAIClient = () => {
    try {
        if (!openai) {
            openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
        return openai;
    } catch (err) {
        console.error("OpenAI Client Init Failed:", err);
        throw err;
    }
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
                        1. **Text vs Selection (CRITICAL)**: 
                           - Compare the "Full Address" text against the selected City/District.
                           - If the Address text says "Moratuwa" but Selected City is "Jaffna" -> **REJECT IMMEDIATELY**.
                           - This check applies EVEN IF coordinates are missing.
                        
                        2. **Hierarchy**: Does the City belong to the District/Province? 

                        3. **Geo Check (Two Paths)**: 
                           
                           **PATH A: Map Blocked / Default** (lat=0, lng=0 or missing)
                           - **Action**: SKIP Geo Check COMPLETELY.
                           - Only rely on Text vs City validation.
                           
                           **PATH B: Map Active** (Valid Coordinates Provided)
                           - **Action**: CRITICAL DISTANCE CHECK.
                           - Calculate distance between Pin (${coordinates?.lat}, ${coordinates?.lng}) and City Center (${city}).
                           - **Rule**: If distance > **15km**, **REJECT IMMEDIATELY**.
                           - Return error: "Pin location is too far (~X km) from selected city".
                           - DO NOT ALLOW exceptions for "near enough" if > 15km.
                           
                        4. **Final Decision**:
                           - If Path A: Valid if Text matches City.
                           - If Path B: Valid ONLY if Text matches City AND Pin is within 15km.

                        **Return JSON**:
                        {
                            "isValid": boolean, // False if any significant mismatch
                            "errors": {
                                "hierarchy": string | null, // e.g. "City X is not in District Y"
                                "addressText": string | null, // e.g. "Address text mentions Galle but City is Colombo"
                                "coordinates": string | null // e.g. "Pin is ~20km away from Kandy (Max 15km)"
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

            // Log to file for debugging
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logEntry = `\n[${new Date().toISOString()}] Input: ${city}, ${coordinates?.lat},${coordinates?.lng} | Result: ${result.isValid} | Errors: ${JSON.stringify(result.errors)}`;
                fs.appendFileSync(path.join(process.cwd(), 'logs', 'address_debug.log'), logEntry);
            } catch (e) { console.error("Log failed", e); }

            if (!result.isValid) console.log("AI Errors:", result.errors);

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
