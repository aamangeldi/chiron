"use client";

import { useState, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Message } from "@/lib/types";
import { apiClient } from "@/lib/api";

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your Hopscotch AI assistant. I can help you explore and understand your browsing history. What would you like to know?",
    timestamp: new Date(Date.now() - 60000),
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  // Fetch recent history for context
  useEffect(() => {
    async function fetchRecentHistory() {
      try {
        const history = await apiClient.getRecentHistory(24, 50);
        setRecentHistory(history);
      } catch (error) {
        console.error("Error fetching recent history:", error);
      }
    }

    fetchRecentHistory();
  }, []);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare context with recent browsing history
      const context = {
        recent_history: recentHistory.slice(0, 50).map((entry) => ({
          url: entry.url,
          title: entry.title || "",
          visit_time: entry.visit_time,
          domain: entry.metadata?.domain || "",
        })),
      };

      // Send message to AI agent with context
      const response = await apiClient.chatWithContext(content, context);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please make sure the backend is running and the AI agent is configured properly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-blue-600 text-white px-6 py-4 border-b border-blue-700">
        <h2 className="text-xl font-semibold">Chat with AI</h2>
        <p className="text-sm text-blue-100 mt-1">
          Ask me anything about your browsing history
        </p>
      </div>
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
