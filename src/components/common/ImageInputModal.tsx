import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import Modal from './Modal'; // Assuming Modal is in the same common directory

interface ImageInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void;
  initialUrl?: string;
}

const ImageInputModal: React.FC<ImageInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialUrl = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setUrlInput(initialUrl);
      setPreviewUrl(initialUrl);
    }
  }, [isOpen, initialUrl]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!urlInput) {
      setPreviewUrl(null);
    }
  }, [file, urlInput]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setUrlInput(''); // Clear URL input if a file is selected
    }
  };

  const handleUrlInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setUrlInput(newUrl);
    setPreviewUrl(newUrl); // Update preview directly from URL input
    setFile(null); // Clear file if URL is being typed
  };

  const handleConfirm = () => {
    if (file && previewUrl) {
      onConfirm(previewUrl); // Use Data URL from file
    } else if (urlInput) {
      onConfirm(urlInput); // Use URL from input
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const isConfirmDisabled = !file && !urlInput;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-lg">
      <div className="space-y-4 p-4">
        <h3 className="text-lg font-semibold text-text-primary">Add Image</h3>
        <p className="text-sm text-text-muted">Upload an image or paste an image URL.</p>

        <div className="space-y-3">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-sm text-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-accent/10 file:text-accent
                hover:file:bg-accent/20"
            />
          </div>

          <div className="flex items-center justify-center text-text-muted">
            <span className="w-full border-t border-border/60" />
            <span className="px-3 text-xs">OR</span>
            <span className="w-full border-t border-border/60" />
          </div>

          {/* URL Input */}
          <div>
            <label htmlFor="imageUrlInput" className="block text-sm font-medium text-text-secondary mb-1">Image URL</label>
            <input
              id="imageUrlInput"
              type="text"
              value={urlInput}
              onChange={handleUrlInputChange}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-text-secondary mb-2">Preview:</p>
              <div className="max-h-48 overflow-hidden rounded-md border border-border/60 bg-surface-muted flex items-center justify-center">
                <img src={previewUrl} alt="Image preview" className="max-w-full max-h-48 object-contain" />
              </div>
            </div>
          )}
        </div>

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
            disabled={isConfirmDisabled}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Image
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageInputModal;