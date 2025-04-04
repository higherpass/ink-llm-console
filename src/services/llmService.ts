import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { type BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { LLMConfig, Message } from '../types/index.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export class LLMService {
  private model: ChatAnthropic | ChatOpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    
    if (config.provider === 'anthropic') {
      this.model = new ChatAnthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: config.model || 'claude-3-opus-20240229',
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    } else {
      this.model = new ChatOpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
        modelName: config.model || 'gpt-4-turbo',
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    }
  }

  private convertToLangChainMessages(messages: Message[]) {
    return messages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      let langchainMessages = this.convertToLangChainMessages(messages);
      
      // Add system prompt if configured and not already present
      if (this.config.systemPrompt && !messages.some(msg => msg.role === 'system')) {
        langchainMessages = [new SystemMessage(this.config.systemPrompt), ...langchainMessages];
      }
      
      const response = await this.model.invoke(langchainMessages);
      return response.content.toString();
    } catch (error) {
      console.error('Error calling LLM:', error);
      throw new Error(`Failed to get response from ${this.config.provider}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getConfig(): LLMConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    // Create a completely new config object to avoid any reference issues
    const updatedConfig = { ...this.config };
    
    // Explicitly handle each field to ensure they're properly updated
    if (newConfig.provider !== undefined) updatedConfig.provider = newConfig.provider;
    if (newConfig.model !== undefined) updatedConfig.model = newConfig.model;
    if (newConfig.apiKey !== undefined) updatedConfig.apiKey = newConfig.apiKey;
    if (newConfig.temperature !== undefined) updatedConfig.temperature = newConfig.temperature;
    if (newConfig.maxTokens !== undefined) updatedConfig.maxTokens = newConfig.maxTokens;
    if (newConfig.systemPrompt !== undefined) updatedConfig.systemPrompt = newConfig.systemPrompt;
    if (newConfig.saveDirectory !== undefined) updatedConfig.saveDirectory = newConfig.saveDirectory;
    
    // Special handling for saveFormat to ensure it's properly updated
    if (newConfig.saveFormat !== undefined) {
      updatedConfig.saveFormat = newConfig.saveFormat;
    }
    
    // Assign the updated config - create a new object to ensure it's not the same reference
    this.config = JSON.parse(JSON.stringify(updatedConfig));
    
    // Recreate the model with the new configuration
    if (this.config.provider === 'anthropic') {
      this.model = new ChatAnthropic({
        apiKey: this.config.apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: this.config.model || 'claude-3-opus-20240229',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
    } else {
      this.model = new ChatOpenAI({
        apiKey: this.config.apiKey || process.env.OPENAI_API_KEY,
        modelName: this.config.model || 'gpt-4-turbo',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
    }
  }

  saveChat(messages: Message[], title?: string): string {
    try {
      // Create save directory if it doesn't exist
      const saveDir = this.config.saveDirectory || process.env.CHAT_SAVE_DIRECTORY || './chats';
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }

      // Determine save format - use config value explicitly
      const saveFormat = this.config.saveFormat;
      
      // Ensure we have a valid format, defaulting to json if undefined
      const formatToUse = saveFormat === 'markdown' ? 'markdown' : 'json';
      
      // Generate filename based on date, optional title, and format
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = formatToUse === 'markdown' ? 'md' : 'json';
      const filename = title 
        ? `${timestamp}-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExtension}`
        : `${timestamp}-chat.${fileExtension}`;
      
      const filePath = path.join(saveDir, filename);
      
      if (formatToUse === 'markdown') {
        // Format as markdown
        const formattedDate = new Date().toLocaleString();
        let markdownContent = `# Chat - ${formattedDate}\n\n`;
        markdownContent += `**Model**: ${this.config.model} (${this.config.provider})\n\n`;
        markdownContent += `---\n\n`;
        
        // Add messages
        messages.forEach(msg => {
          if (msg.role === 'system') {
            markdownContent += `## System\n\n${msg.content}\n\n---\n\n`;
          } else if (msg.role === 'user') {
            markdownContent += `## User\n\n${msg.content}\n\n---\n\n`;
          } else if (msg.role === 'assistant') {
            markdownContent += `## Assistant\n\n${msg.content}\n\n---\n\n`;
          }
        });
        
        // Write to file
        fs.writeFileSync(filePath, markdownContent);
      } else {
        // Format as JSON (default)
        const chatData = {
          timestamp: new Date().toISOString(),
          model: this.config.model,
          provider: this.config.provider,
          messages: messages
        };
        
        // Write to file
        fs.writeFileSync(filePath, JSON.stringify(chatData, null, 2));
      }
      
      return filePath;
    } catch (error) {
      console.error('Error saving chat:', error);
      throw new Error(`Failed to save chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Available models by provider
export const availableModels = {
  anthropic: [
    'claude-3-7-sonnet-20250219',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  openai: [
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4',
    'gpt-3.5-turbo'
  ]
};

// Default configuration
export const defaultConfig: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful AI assistant.',
  saveDirectory: process.env.CHAT_SAVE_DIRECTORY || './chats',
  saveFormat: process.env.CHAT_SAVE_FORMAT === 'markdown' ? 'markdown' : 'json',
};
