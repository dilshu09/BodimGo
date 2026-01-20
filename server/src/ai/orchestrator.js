import AIAudit from '../models/AIAudit.js';
import { AbusiveWordsCheckAgent } from './abusive.agent.js';
import { AddressVerificationAgent } from './address.agent.js';
import { ImageModerationAgent } from './image.agent.js';
import { AgreementGeneratorAgent } from './agreement.agent.js';

// Registry of available agents
const agents = {
  'AbusiveWordsCheckAgent': new AbusiveWordsCheckAgent(),
  'AddressVerificationAgent': new AddressVerificationAgent(),
  'ImageModerationAgent': new ImageModerationAgent(),
  'AgreementGeneratorAgent': new AgreementGeneratorAgent(),
};

export const runAgent = async (agentName, input, entityContext) => {
  const agent = agents[agentName];
  
  if (!agent) {
    throw new Error(`Agent ${agentName} not found`);
  }

  // 1. Run Agent
  const result = await agent.execute(input);

  // 2. Audit Log (Async, don't block)
  try {
    await AIAudit.create({
      agentName,
      actionType: 'moderation',
      entityType: entityContext.type,
      entityId: entityContext.id,
      inputHash: JSON.stringify(input), // In real prod, hash this
      outputResult: result,
      riskScore: result.severity === 'high' ? 100 : result.severity === 'medium' ? 50 : 0,
      decision: result.action
    });
  } catch (err) {
    console.error("Audit Log Failed:", err);
  }

  return result;
};
