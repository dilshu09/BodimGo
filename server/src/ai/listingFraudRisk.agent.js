import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';

let openai;
const getOpenAIClient = () => {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

export class ListingFraudRiskAgent extends AIAgent {
    constructor() {
        super('ListingFraudRiskAgent');
    }

    async execute(input) {
        const { listing, providerContext } = input;
        
        // Rules-based logic (Fast Check)
        let riskScore = 0;
        const reasons = [];

        // 1. Price Anomaly Check (Super simple baseline)
        if (listing.rent < 2000) {
            riskScore += 40; 
            reasons.push("Suspiciously low rent");
        }

        // 2. Description Coherence (AI)
        try {
            const client = getOpenAIClient();
            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a Fraud Risk Analyst for a boarding platform.
                        Analyze the rental listing details for potential scam indicators (vague details, too good to be true, generic text, urgent demands).
                        Return JSON: { "riskScore": 0-100, "reason": "string" }`
                    },
                    { role: "user", content: JSON.stringify(listing) }
                ],
                model: "gpt-3.5-turbo",
                response_format: { type: "json_object" }
            });
            const result = JSON.parse(completion.choices[0].message.content);
            riskScore += result.riskScore || 0;
            if (result.reason) reasons.push(result.reason);

        } catch (error) {
            console.error("AI Fraud Check Error:", error);
        }

        const normalizedScore = Math.min(riskScore, 100);
        
        return {
            riskScore: normalizedScore,
            level: normalizedScore > 70 ? 'high' : (normalizedScore > 30 ? 'medium' : 'low'),
            reasons
        };
    }
}
