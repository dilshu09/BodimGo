import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';

let openai;
const getOpenAIClient = () => {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

export class PersonalInfoLeakAgent extends AIAgent {
    constructor() {
        super('PersonalInfoLeakAgent');
    }

    async execute(input) {
        const { text } = input;
        
        // Basic Regex Check first (Optimization)
        const phoneRegex = /(?:\+94|0)?7[0-9]{8}/;
        const nicRegex = /[0-9]{9}[vVxX]|[0-9]{12}/;

        if (phoneRegex.test(text) || nicRegex.test(text)) {
             return {
                hasLeak: true,
                severity: "high",
                leakedTypes: phoneRegex.test(text) ? ["phone"] : ["nic"],
                action: "mask"
             };
        }

        // GPT Check for subtle leaks (email, social handles, bank details)
        try {
            const client = getOpenAIClient();
            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You represent a privacy protection agent. 
                        Analyze the text for personally identifiable information (PII) such as phone numbers, emails, bank account numbers, or NICs.
                        Return JSON: { "hasLeak": boolean, "leakedTypes": [string], "action": "allow" | "mask" | "block" }`
                    },
                    { role: "user", content: text }
                ],
                model: "gpt-3.5-turbo",
                response_format: { type: "json_object" }
            });
            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("AI Error:", error);
            return { hasLeak: false, action: "allow" };
        }
    }
}
