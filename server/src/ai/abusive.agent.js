import { AIAgent } from './base.agent.js';
import OpenAI from 'openai';


let openai;

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};


export class AbusiveWordsCheckAgent extends AIAgent {
  constructor() {
    super('AbusiveWordsCheckAgent');
  }

    async execute(input) {
    const { text, context } = input;

    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a Content Safety & Privacy Guard for BodimGo, a boarding platform in Sri Lanka. 
            Analyze the text for:
            1. Abusive/Hate Speech/Harassment.
            2. PERSONAL CONTACT INFO (PII) LEAKS (Crucial): Identifying phone numbers in the description.
            
            **PII Detection Guidelines (Sri Lankan Context):**
            - Users try to hide numbers. Look for:
            - Standard formats: "0771234567", "+94..."
            - Spaced formats: "0 7 7 1 2..."
            - Word formats (English): "Zero seven seven...", "Call me at seven seven..."
            - Word formats (Singlish/Sinhala): "binduwa", "hatha", "thuna", "call karanna mekata", "wahtsapp", "viber".
            - Obfuscated: "0.7.7...", "call - 071...", "cont: 07x..."

            Return JSON: 
            {
              "is_allowed": boolean, // false if abusive OR contains PII in public text
              "severity": "low"|"medium"|"high",
              "categories": ["abuse"|"harassment"|"hate"|"sexual"|"scam"|"threat"|"pii_leak"],
              "pii_detected": boolean,
              "reason": "Short explanation",
              "action": "allow"|"warn"|"block"
            }`
          },
          { role: "user", content: text }
        ],
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;

    } catch (error) {
      console.error("AI Error:", error);
      return { 
        is_allowed: true, 
        severity: "low", 
        categories: [], 
        action: "allow" 
      };
    }
  }
}
