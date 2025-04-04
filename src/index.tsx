#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { LLMService, defaultConfig } from './services/llmService.js';
import { ChatInterface } from './components/ChatInterface.js';
import { SettingsInterface } from './components/SettingsInterface.js';

const App = () => {
  const [llmService] = useState(() => new LLMService(defaultConfig));
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
    
    // Use Tab key for settings toggle (universally supported)
    if (key.tab) {
      setView(view === 'chat' ? 'settings' : 'chat');
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {view === 'chat' ? (
        <ChatInterface llmService={llmService} />
      ) : (
        <SettingsInterface 
          llmService={llmService} 
          onSave={() => setView('chat')} 
        />
      )}
      
      <Box flexDirection="column" marginTop={1} height={6}>
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
          <Box width={'100%'} justifyContent="space-between">
            <Text color="gray" wrap="truncate">
              Provider: <Text color="cyan">{llmService.getConfig().provider}</Text> | 
              Model: <Text color="cyan">{llmService.getConfig().model}</Text> | 
              Temp: <Text color="cyan">{llmService.getConfig().temperature}</Text> | 
              Max Tokens: <Text color="cyan">{llmService.getConfig().maxTokens}</Text>
            </Text>
          </Box>
          <Box><Text> </Text></Box>
          <Box>
            <Text color="gray">
              Press <Text color="green" bold>Tab</Text> to toggle settings | <Text color="red" bold>Ctrl+S</Text> to save chat | <Text color="red" bold>Ctrl+C</Text> to exit
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Make sure we properly render and wait
const app = render(<App />);
await app.waitUntilExit();
