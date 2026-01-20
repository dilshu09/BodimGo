/**
 * Abstract Base Class for all AI Agents
 */
export class AIAgent {
  constructor(name) {
    if (this.constructor === AIAgent) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.name = name;
  }

  /**
   * Main execution method
   * @param {Object} input - Data strictly typed for the agent
   * @returns {Promise<Object>} - Structured JSON result
   */
  async execute(input) {
    throw new Error("Method 'execute()' must be implemented.");
  }

  /**
   * Helper: Calculate a hash of the input for privacy/audit
   */
  hashInput(input) {
    // Simple hash implementation or usage of crypto
    return JSON.stringify(input).length; // Placeholder
  }
}
