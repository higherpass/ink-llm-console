import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Message } from '../types/index.js';
import { LLMService } from '../services/llmService.js';
import { MessageInput } from './MessageInput.js';
import fs from 'fs';
import path from 'path';

interface ChatInterfaceProps {
  llmService: LLMService;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ llmService }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const systemPrompt = llmService.getConfig().systemPrompt;
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    
    // Save chat with Ctrl+S
    if (key.ctrl && input === 's') {
      if (messages.length > 0) {
        try {
          const savedPath = llmService.saveChat(messages);
          setSaveStatus(`Chat saved to: ${savedPath}`);
          
          // Clear status after 3 seconds
          setTimeout(() => {
            setSaveStatus(null);
          }, 3000);
        } catch (error) {
          setSaveStatus(`Error saving chat: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        setSaveStatus('No messages to save');
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      }
    }
  });

  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim()) return;

    const userMessage: Message = { role: 'user', content: value };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create message array with system prompt if available
      const messagesWithSystem = [...messages, userMessage];
      
      const response = await llmService.sendMessage(messagesWithSystem);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, llmService]);

  // Memoize the messages display to prevent re-rendering when typing
  const messagesDisplay = useMemo(() => (
    <Box flexDirection="column" flexGrow={1} marginBottom={1}>
      {messages.length === 0 ? (
        <Text color="gray">Start a conversation by typing a message below.</Text>
      ) : (
        messages.map((msg, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.role === 'user' ? 'blue' : 'green'}>
              {msg.role === 'user' ? 'You' : 'Assistant'}:
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))
      )}
      {isLoading && (
        <Text color="yellow">Assistant is thinking...</Text>
      )}
    </Box>
  ), [messages, isLoading]);

  // Memoize the header to prevent re-rendering when typing
  const header = useMemo(() => (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">
        LLM Console Chat ({llmService.getConfig().provider} - {llmService.getConfig().model})
      </Text>
      {systemPrompt && (
        <Text color="gray" italic>
          System prompt: {systemPrompt}
        </Text>
      )}
    </Box>
  ), [llmService, systemPrompt]);

  return (
    <Box flexDirection="column" padding={1} height="100%">
      {header}
      {messagesDisplay}
      {saveStatus && (
        <Box marginBottom={1}>
          <Text color={saveStatus.includes('Error') ? 'red' : 'green'}>
            {saveStatus}
          </Text>
        </Box>
      )}
      <MessageInput onSubmit={handleSubmit} />
      <Box marginTop={1}>
        <Text color="gray">Press Ctrl+S to save this chat</Text>
      </Box>
    </Box>
  );
};
