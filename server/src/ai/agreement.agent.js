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

export class AgreementGeneratorAgent extends AIAgent {
  constructor() {
    super('AgreementGeneratorAgent');
  }

  async execute(input) {
    const { prompt } = input;

    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an Expert Legal Assistant for BodimGo, a boarding management platform in Sri Lanka.
            Your task is to draft clear, professional, and legally sound Terms & Conditions for a rental agreement based on the user's instructions.
            
            **Guidelines:**
            - Use a professional but accessible tone.
            - Structure the terms clearly (numbered lists or bullet points).
            - Cover key areas mentioned by the user (e.g., visitors, payments, quiet hours).
            - If the user prompt is vague (e.g., "standard rules"), provide a comprehensive standard set of rules suitable for a Sri Lankan boarding place (annex/room).
            - Output ONLY the agreement text content. Do not include conversational filler like "Here is your agreement:".

            **Format:**
            - Markdown is supported.
            - Use bolding for headers.
            `
          },
          { role: "user", content: prompt }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      return { text: completion.choices[0].message.content };

    } catch (error) {
      console.error("Agreement Agent Error:", error);
      return { 
        text: "Error generating agreement. Please try again or draft manually.",
        error: error.message
      };
    }
  }
}
