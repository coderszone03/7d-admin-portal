import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal'; // Assuming Modal is in the same common directory

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  message,
  initialValue = '',
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      // Focus the input when the modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure modal is rendered
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue(''); // Clear for next use
  };

  const handleCancel = () => {
    onCancel();
    setInputValue(''); // Clear for next use
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-sm">
      <div className="space-y-4 p-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted">{message}</p>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Enter URL"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PromptModal;