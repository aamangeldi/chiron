import { Message } from "./types";

export const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your Hopscotch AI assistant. I can help you explore and understand your browsing history. What would you like to know?",
    timestamp: new Date(Date.now() - 60000),
  },
];

// Mock AI responses for testing
export const mockResponses = [
  "Based on your recent browsing, you've been researching TypeScript and Next.js. Would you like me to summarize what I found?",
  "I noticed you visited several documentation sites. Here are the main topics you explored...",
  "Your browsing patterns suggest you're working on a web development project. Would you like insights about your research?",
  "I can help you find that page you visited last week. Can you tell me more about what you're looking for?",
];

export function getMockResponse(): string {
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export async function sendMessageToAI(userMessage: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return a mock response
  return getMockResponse();
}
