import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { LLMService, availableModels } from '../services/llmService.js';
import { LLMConfig } from '../types/index.js';
import { SelectInput } from './SelectInput.js';

interface SettingsInterfaceProps {
  llmService: LLMService;
  onSave: () => void;
}

export const SettingsInterface: React.FC<SettingsInterfaceProps> = ({ 
  llmService, 
  onSave 
}) => {
  const currentConfig = llmService.getConfig();
  const [provider, setProvider] = useState<'anthropic' | 'openai'>(currentConfig.provider);
  const [model, setModel] = useState<string>(currentConfig.model);
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [temperature, setTemperature] = useState<string>(currentConfig.temperature.toString());
  const [maxTokens, setMaxTokens] = useState<string>(currentConfig.maxTokens.toString());
  const [systemPrompt, setSystemPrompt] = useState<string>(currentConfig.systemPrompt || 'You are a helpful AI assistant.');
  const [saveFormat, setSaveFormat] = useState<'json' | 'markdown'>(currentConfig.saveFormat || 'json');
  const [currentField, setCurrentField] = useState<'provider' | 'model' | 'apiKey' | 'temperature' | 'maxTokens' | 'systemPrompt' | 'saveFormat'>('provider');

  // Update model when provider changes to ensure we use a valid model for the provider
  useEffect(() => {
    // If current model is not in the list for the selected provider, use the first one
    if (!availableModels[provider].includes(model)) {
      setModel(availableModels[provider][0]);
    }
  }, [provider]);

  // Ensure saveFormat is properly initialized from config
  useEffect(() => {
    setSaveFormat(currentConfig.saveFormat || 'json');
  }, []);

  // Function to save settings
  const saveSettings = () => {
    // Get the current format directly from state
    const format = saveFormat;
    
    // Create a new config object
    const newConfig: LLMConfig = {
      provider: provider as 'anthropic' | 'openai',
      model,
      apiKey: apiKey || undefined,
      temperature: parseFloat(temperature) || 0.7,
      maxTokens: parseInt(maxTokens) || 1000,
      systemPrompt: systemPrompt || undefined,
      saveDirectory: llmService.getConfig().saveDirectory,
      saveFormat: format
    };
    
    // Update the config with a completely new object to avoid reference issues
    llmService.updateConfig(JSON.parse(JSON.stringify(newConfig)));
    onSave();
  };

  // Main input handler for navigation
  useInput((input, key) => {
    // Use Tab or Enter for settings navigation (more reliable than F2)
    if (key.tab || key.return) {
      if (currentField === 'provider') {
        setCurrentField('model');
      } else if (currentField === 'model') {
        setCurrentField('apiKey');
      } else if (currentField === 'apiKey') {
        setCurrentField('temperature');
      } else if (currentField === 'temperature') {
        setCurrentField('maxTokens');
      } else if (currentField === 'maxTokens') {
        setCurrentField('systemPrompt');
      } else if (currentField === 'systemPrompt') {
        setCurrentField('saveFormat');
      } else {
        // Save settings
        saveSettings();
      }
    }
  });

  // Format-specific input handler
  useInput((input, key) => {
    if (currentField === 'saveFormat') {
      if (key.upArrow || key.downArrow) {
        // Toggle between json and markdown
        const newFormat = saveFormat === 'json' ? 'markdown' : 'json';
        setSaveFormat(newFormat);
      } else if (key.return) {
        // Save with current format
        saveSettings();
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">LLM Settings</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1} flexDirection="column">
          <Text bold>Provider: </Text>
          {currentField === 'provider' ? (
            <SelectInput
              items={['anthropic', 'openai']}
              value={provider}
              onChange={(value) => setProvider(value as 'anthropic' | 'openai')}
              onSubmit={() => setCurrentField('model')}
            />
          ) : (
            <Text>{provider}</Text>
          )}
        </Box>

        <Box marginBottom={1} flexDirection="column">
          <Text bold>Model: </Text>
          {currentField === 'model' ? (
            <SelectInput
              items={availableModels[provider]}
              value={model}
              onChange={setModel}
              onSubmit={() => setCurrentField('apiKey')}
            />
          ) : (
            <Text>{model}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text bold>API Key: </Text>
          {currentField === 'apiKey' ? (
            <TextInput
              value={apiKey}
              onChange={setApiKey}
              placeholder="Enter API key (or leave blank to use env variable)"
              onSubmit={() => setCurrentField('temperature')}
            />
          ) : (
            <Text>{apiKey ? '********' : 'Using environment variable'}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text bold>Temperature: </Text>
          {currentField === 'temperature' ? (
            <TextInput
              value={temperature}
              onChange={setTemperature}
              placeholder="Enter temperature (0.0-1.0)"
              onSubmit={() => setCurrentField('maxTokens')}
            />
          ) : (
            <Text>{temperature}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text bold>Max Tokens: </Text>
          {currentField === 'maxTokens' ? (
            <TextInput
              value={maxTokens}
              onChange={setMaxTokens}
              placeholder="Enter max output tokens"
              onSubmit={() => setCurrentField('systemPrompt')}
            />
          ) : (
            <Text>{maxTokens}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text bold>System Prompt: </Text>
          {currentField === 'systemPrompt' ? (
            <TextInput
              value={systemPrompt}
              onChange={setSystemPrompt}
              placeholder="Enter system prompt"
              onSubmit={() => setCurrentField('saveFormat')}
            />
          ) : (
            <Text>{systemPrompt}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text bold>Save Format: </Text>
          {currentField === 'saveFormat' ? (
            <Box flexDirection="column">
              <Text>Current format: {saveFormat}</Text>
              <Box marginY={1}>
                <Text color={saveFormat === 'json' ? 'green' : undefined}>
                  {saveFormat === 'json' ? '› ' : '  '}
                  json {saveFormat === 'json' ? ' ✓' : ''}
                </Text>
              </Box>
              <Box marginY={1}>
                <Text color={saveFormat === 'markdown' ? 'green' : undefined}>
                  {saveFormat === 'markdown' ? '› ' : '  '}
                  markdown {saveFormat === 'markdown' ? ' ✓' : ''}
                </Text>
              </Box>
              <Box marginTop={1}>
                <Text color="gray">Use up/down arrows to select, Enter to save</Text>
              </Box>
              
              {/* No custom input handler here - moved to top level */}
            </Box>
          ) : (
            <Text>{saveFormat}</Text>
          )}
        </Box>
      </Box>

      <Text color="gray">
        Press Tab or Enter to move to the next field. After completing all fields, press Tab or Enter to save.
      </Text>
    </Box>
  );
};
