"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Message } from "@/lib/types";
import { initialMessages, sendMessageToAI } from "@/lib/mockData";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

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
      // Get AI response (mock for now)
      const aiResponse = await sendMessageToAI(content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
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
