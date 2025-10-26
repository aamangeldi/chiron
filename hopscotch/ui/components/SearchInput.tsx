'use client';

import { PLACEHOLDER_TEXT } from '@/constants/navigationSearch';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function SearchInput({ value, onChange, onSubmit, disabled = false }: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={PLACEHOLDER_TEXT}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-900 placeholder-gray-500 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}
