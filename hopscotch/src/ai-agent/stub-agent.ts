/**
 * Stub AI Agent Implementation
 *
 * TODO FOR TEAMMATE:
 * Replace this with your actual AI agent implementation.
 *
 * Possible approaches:
 * 1. OpenAI API integration
 * 2. Anthropic Claude API integration
 * 3. Local LLM (Ollama, llama.cpp, etc.)
 * 4. Custom model inference
 *
 * The agent should:
 * - Accept browsing history context
 * - Provide intelligent responses/suggestions
 * - Enable novel interactions with web browsing
 */

import { IAIAgent } from '../shared/interfaces';
import { AgentMessage, AgentResponse } from '../shared/types';
import { formatHistorySummary, formatHistoryByDomain } from '../shared/formatters';
import { randomUUID } from 'crypto';

export class StubAIAgent implements IAIAgent {
  private ready: boolean = false;

  async initialize(): Promise<void> {
    console.log('[AIAgent] Initializing stub agent...');

    // TODO: Initialize your AI model/API here
    // - Load model
    // - Connect to API
    // - Set up context window
    // - Configure parameters

    this.ready = true;
    console.log('[AIAgent] Stub agent ready');
  }

  async sendMessage(message: AgentMessage): Promise<AgentResponse> {
    if (!this.ready) {
      throw new Error('Agent not initialized');
    }

    console.log('[AIAgent] Received message:', message.content);
    console.log('[AIAgent] Context entries:', message.context?.length || 0);

    // TODO: Implement actual AI interaction
    // Example of how to use the browsing history context:

    let responseContent = 'This is a stub response. Implement your AI agent to replace this.\n\n';

    // If history context is provided, format it for the prompt
    if (message.context && message.context.length > 0) {
      console.log('[AIAgent] Formatting history context...');

      // Example: Format as summary (for shorter prompts)
      const historySummary = formatHistorySummary(message.context);

      // Example: Format by domain (for domain-based analysis)
      const historyByDomain = formatHistoryByDomain(message.context);

      // In a real implementation, you would insert this into your AI prompt:
      // const prompt = `
      //   User question: ${message.content}
      //
      //   Recent browsing history:
      //   ${historySummary}
      //
      //   Please answer the user's question based on their browsing history.
      // `;

      responseContent += 'I received your browsing history context:\n\n';
      responseContent += `- ${message.context.length} history entries\n`;
      responseContent += `- Most recent: ${message.context[0]?.title || 'N/A'}\n\n`;
      responseContent += 'Here\'s how the history is formatted for AI consumption:\n\n';
      responseContent += historySummary.substring(0, 500) + '...\n\n';
      responseContent += '(In a real implementation, this would be sent to your AI model)';
    }

    // Stub response
    return {
      id: randomUUID(),
      messageId: message.id,
      content: responseContent,
      timestamp: new Date(),
      metadata: {
        model: 'stub',
        contextSize: message.context?.length || 0,
      },
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  async shutdown(): Promise<void> {
    console.log('[AIAgent] Shutting down...');

    // TODO: Clean up resources
    // - Close API connections
    // - Unload models
    // - Save state if needed

    this.ready = false;
  }
}
