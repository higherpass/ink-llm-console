import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface SelectInputProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({ 
  items, 
  value, 
  onChange,
  onSubmit
}) => {
  // Find the initial index, defaulting to 0 if not found
  const initialIndex = Math.max(0, items.findIndex(item => item === value));
  const [highlightedIndex, setHighlightedIndex] = useState(initialIndex);

  // Update highlighted index when value changes externally
  useEffect(() => {
    const index = items.findIndex(item => item === value);
    if (index !== -1) {
      setHighlightedIndex(index);
    }
  }, [value, items]);

  useInput((input, key) => {
    if (key.upArrow) {
      const newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
      setHighlightedIndex(newIndex);
    } else if (key.downArrow) {
      const newIndex = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
      setHighlightedIndex(newIndex);
    } else if (key.return) {
      const selectedValue = items[highlightedIndex];
      
      // Update the parent component's state first
      onChange(selectedValue);
      
      // Pass the selected value directly to onSubmit to avoid state timing issues
      if (onSubmit) {
        // Store the selected value in a global variable to ensure it's available
        (global as any).__lastSelectedValue = selectedValue;
        onSubmit();
      }
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={item}>
          <Text color={index === highlightedIndex ? 'green' : undefined}>
            {index === highlightedIndex ? '› ' : '  '}
            {item}
            {item === value ? ' ✓' : ''}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray">Use arrow keys to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
};
