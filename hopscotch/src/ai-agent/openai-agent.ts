/**
 * OpenAI-based AI Agent Implementation
 */

import { IAIAgent } from '../shared/interfaces';
import { AgentMessage, AgentResponse } from '../shared/types';
import { formatHistorySummary } from '../shared/formatters';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

export class OpenAIAgent implements IAIAgent {
  private ready: boolean = false;
  private client: OpenAI | null = null;
  private model: string = 'gpt-5-mini'; // Latest mini model

  async initialize(): Promise<void> {
    console.log('[OpenAIAgent] Initializing...');

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable not set. Please set it before starting the app.'
      );
    }

    // Initialize OpenAI client
    this.client = new OpenAI({ apiKey });

    this.ready = true;
    console.log('[OpenAIAgent] Initialized with model:', this.model);
  }

  async sendMessage(message: AgentMessage): Promise<AgentResponse> {
    if (!this.ready || !this.client) {
      throw new Error('Agent not initialized');
    }

    console.log('[OpenAIAgent] Processing message:', message.content);
    console.log('[OpenAIAgent] Context entries:', message.context?.length || 0);

    try {
      // Format browsing history context
      let systemPrompt = `You are a helpful AI assistant with access to the user's browsing history.
You can help them recall websites they've visited, understand their research patterns, and answer questions about their browsing activity.

Be conversational and helpful. If the user asks about their browsing history, use the context provided to give accurate answers.`;

      // Prepare messages for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      // Add browsing history context if available
      if (message.context && message.context.length > 0) {
        const historyContext = formatHistorySummary(message.context);
        messages.push({
          role: 'system',
          content: `Recent browsing history:\n\n${historyContext}`,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message.content,
      });

      // Call OpenAI API
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        // GPT-5 mini only supports default temperature (1.0)
        max_completion_tokens: 5000, // Increased for reasoning + response
      });

      const responseText = completion.choices[0]?.message?.content || 'No response generated.';

      console.log('[OpenAIAgent] Response generated');
      console.log('[OpenAIAgent] Response text:', responseText);
      console.log('[OpenAIAgent] Full completion:', JSON.stringify(completion, null, 2));

      return {
        id: randomUUID(),
        messageId: message.id,
        content: responseText,
        timestamp: new Date(),
        metadata: {
          model: this.model,
          contextSize: message.context?.length || 0,
          usage: completion.usage,
        },
      };
    } catch (error) {
      console.error('[OpenAIAgent] Error:', error);
      throw new Error(`Failed to get response from OpenAI: ${error}`);
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async shutdown(): Promise<void> {
    console.log('[OpenAIAgent] Shutting down...');
    this.ready = false;
    this.client = null;
  }
}
