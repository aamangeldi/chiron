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

    console.log('[AIAgent] Received message:', message);
    console.log('[AIAgent] Context entries:', message.context?.length || 0);

    // TODO: Implement actual AI interaction
    // - Process message content
    // - Use browsing history context
    // - Generate intelligent response
    // - Return structured response

    // Stub response
    return {
      id: randomUUID(),
      messageId: message.id,
      content: 'This is a stub response. Implement your AI agent to replace this.',
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
