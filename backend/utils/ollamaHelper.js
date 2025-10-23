const axios = require('axios');

class OllamaHelper {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async generateReviewer(content, customInstructions = '', mode = 'enhanced') {
    try {
      const prompt = this.buildPrompt(content, customInstructions, mode);
      
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: 'qwen2.5:1.5b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40
        }
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      throw new Error('Failed to generate reviewer. Please make sure Ollama is running with the qwen2.5:1.5b model.');
    }
  }

  buildPrompt(content, customInstructions, mode) {
  const modeInstructions = {
    strict: `
CRITICAL: YOU ARE IN STRICT MODE. YOU MUST FOLLOW THESE RULES EXACTLY:

RULES:
1. ONLY use the exact words and phrases from this content: "${content}"
2. DO NOT define any terms
3. DO NOT explain any concepts  
4. DO NOT add any examples
5. DO NOT use any knowledge from your training
6. DO NOT write any sentences that aren't directly from the provided content
7. If the content is a list, keep it as a list
8. If there are no definitions, do not create definitions

CONTENT TO USE: "${content}"

If the material is just lists, keep it as lists. If there are no definitions, do not add definitions.
    `,

    enhanced: `
ENHANCED MODE: Use the provided study material as a base, and enhance it with your knowledge to create a comprehensive and educational reviewer.

RULES:
- Start with the provided material as foundation
- Add relevant examples, explanations, and additional context
- Expand on concepts to make them more understandable
- Include practical applications and real-world connections

Provided Material: ${content}
    `,

    custom: `
CUSTOM MODE: Follow the user's specific instructions while working with the provided study material.

Provided Material: ${content}
User Instructions: ${customInstructions || 'No specific instructions provided'}
    `
  };

  const basePrompt = `
You are an educational assistant creating study reviewers. ${modeInstructions[mode] || modeInstructions.enhanced}

Structure your response as:
1. KEY CONCEPTS - Main ideas from the material
2. IMPORTANT TERMS - Key terminology mentioned  
3. SUMMARY - Brief overview using only provided content
4. STUDY QUESTIONS - Questions based only on the material
5. MEMORY TIPS - Study strategies

${mode === 'strict' ? 'REMEMBER: STRICT MODE - NO ADDITIONAL KNOWLEDGE, DEFINITIONS, OR EXAMPLES!' : ''}
  `;

  return basePrompt;
}

  async checkOllamaStatus() {
    try {
      await axios.get(`${this.baseURL}/api/tags`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new OllamaHelper();