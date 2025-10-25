/**
 * OpenAI-based AI Agent Implementation
 */

import { IAIAgent } from '../shared/interfaces';
import { AgentMessage, AgentResponse } from '../shared/types';
import { formatHistorySummary } from '../shared/formatters';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
const { tavily } = require('@tavily/core');

export class OpenAIAgent implements IAIAgent {
  private ready: boolean = false;
  private client: OpenAI | null = null;
  private tavilyClient: any | null = null;
  private model: string = 'gpt-5-mini'; // GPT-5 model that supports function calling

  async initialize(): Promise<void> {
    console.log('[OpenAIAgent] Initializing...');

    // Get API keys from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable not set. Please set it before starting the app.'
      );
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      throw new Error(
        'TAVILY_API_KEY environment variable not set. Please set it before starting the app.'
      );
    }

    // Initialize OpenAI client
    this.client = new OpenAI({ apiKey: openaiApiKey });

    // Initialize Tavily client
    this.tavilyClient = new tavily({ apiKey: tavilyApiKey });

    this.ready = true;
    console.log('[OpenAIAgent] Initialized with model:', this.model);
  }

  async sendMessage(message: AgentMessage): Promise<AgentResponse> {
    if (!this.ready || !this.client) {
      throw new Error('Agent not initialized');
    }

    console.log('[OpenAIAgent] Processing message:', message.content);

    try {
      const systemPrompt = `You are a helpful AI assistant with access to the user's browsing history and web search capabilities.
You can help them recall websites they've visited, understand their research patterns, and answer questions about their browsing activity.
When needed, you can search the web for current information to provide comprehensive answers.

IMPORTANT: Always use the appropriate tool when users ask questions:
- Use search_browsing_history when they ask about pages they visited, sites they looked at, or their browsing activity
- Use web_search when they ask about current information like weather, news, stock prices, or any real-time data

Be conversational and helpful. Don't just offer to search - actually perform the search using the available tools.`;

      // Define tools for browsing history search and web search
      const tools: OpenAI.Chat.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'search_browsing_history',
            description: 'Search the user\'s browsing history for websites they\'ve visited. Use this when the user asks about pages they visited, sites they looked at, or their browsing activity.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find in browsing history (searches URLs and page titles)',
                },
                hours: {
                  type: 'number',
                  description: 'How many hours back to search (default: 24)',
                  default: 24,
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 50)',
                  default: 50,
                },
              },
              required: ['query'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for current information. Use this when the user asks about current events, weather, news, or any information that requires up-to-date data from the internet.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to look up on the web',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of search results to return (default: 5)',
                  default: 5,
                },
              },
              required: ['query'],
            },
          },
        },
      ];

      // Prepare initial messages
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message.content,
        },
      ];

      // Call OpenAI API with tools
      let completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: tools,
        max_completion_tokens: 5000,
      });

      console.log('[OpenAIAgent] Initial completion:', JSON.stringify(completion, null, 2));

      // Handle tool calls (if any)
      let responseMessage = completion.choices[0]?.message;

      while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log('[OpenAIAgent] Agent requested tool calls:', responseMessage.tool_calls.length);

        // Add assistant's message with tool calls
        messages.push(responseMessage);

        // Execute each tool call
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'search_browsing_history') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log('[OpenAIAgent] Searching browsing history:', args);

            // Get browsing history from context
            const hours = args.hours || 24;
            const limit = args.limit || 50;

            // Filter context entries based on query
            const filteredEntries = message.context?.filter(entry => {
              const searchStr = `${entry.url} ${entry.title || ''}`.toLowerCase();
              return searchStr.includes(args.query.toLowerCase());
            }).slice(0, limit) || [];

            const historyResults = formatHistorySummary(filteredEntries);
            const toolResult = filteredEntries.length > 0
              ? historyResults
              : `No browsing history found matching "${args.query}" in the last ${hours} hours.`;

            console.log('[OpenAIAgent] Tool result:', toolResult.substring(0, 200) + '...');

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          } else if (toolCall.function.name === 'web_search') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log('[OpenAIAgent] Performing web search with Tavily:', args);

            try {
              if (!this.tavilyClient) {
                throw new Error('Tavily client not initialized');
              }

              const searchQuery = args.query;
              const maxResults = args.max_results || 5;

              // Perform search using Tavily
              const searchResponse = await this.tavilyClient.search(searchQuery, {
                max_results: maxResults,
                include_answer: true,
                include_raw_content: false,
                search_depth: "basic"
              });

              // Format the search results
              let searchResult = '';
              
              if (searchResponse.answer) {
                searchResult += `Answer: ${searchResponse.answer}\n\n`;
              }

              if (searchResponse.results && searchResponse.results.length > 0) {
                searchResult += 'Search Results:\n';
                searchResponse.results.forEach((result: any, index: number) => {
                  searchResult += `${index + 1}. ${result.title}\n`;
                  searchResult += `   URL: ${result.url}\n`;
                  searchResult += `   Content: ${result.content}\n\n`;
                });
              } else {
                searchResult = `No search results found for "${searchQuery}".`;
              }

              console.log('[OpenAIAgent] Web search result:', searchResult.substring(0, 200) + '...');

              // Add tool result to messages
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: searchResult,
              });
            } catch (error) {
              console.error('[OpenAIAgent] Web search error:', error);
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: `Error performing web search: ${error}`,
              });
            }
          }
        }

        // Call API again with tool results
        completion = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
          tools: tools,
          max_completion_tokens: 5000,
        });

        responseMessage = completion.choices[0]?.message;
        console.log('[OpenAIAgent] Follow-up completion:', JSON.stringify(completion, null, 2));
      }

      const responseText = responseMessage?.content || 'No response generated.';

      console.log('[OpenAIAgent] Final response generated');
      console.log('[OpenAIAgent] Response text:', responseText);

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
    this.tavilyClient = null;
  }
}
