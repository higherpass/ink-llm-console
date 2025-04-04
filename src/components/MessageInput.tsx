import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MessageInputProps {
  onSubmit: (message: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;
    onSubmit(value);
    setInput('');
  };

  return (
    <Box>
      <Text>Message: </Text>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="Type your message (Ctrl+C to exit)"
      />
    </Box>
  );
};
