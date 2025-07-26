import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  buttonText?: string;
  placeholder?: string;
  showPreview?: boolean;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      onFileSelect,
      accept,
      maxSize,
      buttonText = 'Choose file',
      placeholder = 'No file chosen',
      showPreview = true,
      ...props
    },
    ref
  ) => {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File size must be less than ${formatFileSize(maxSize)}`;
      }
      if (accept) {
        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isValidType = acceptedTypes.some((type) => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          return (
            fileType === type || fileType.startsWith(type.replace('/*', '/'))
          );
        });

        if (!isValidType) {
          return `File type not supported. Accepted types: ${accept}`;
        }
      }
      return null;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = (file: File | null) => {
      setSelectedFile(file);
      setError(null);
      onFileSelect?.(file);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        handleFileSelect(file);
      }
    };

    const handleDrag = (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === 'dragenter' || event.type === 'dragover') {
        setDragActive(true);
      } else if (event.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      const file = event.dataTransfer.files?.[0] || null;
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        handleFileSelect(file);
      }
    };

    const handleButtonClick = () => {
      inputRef.current?.click();
    };

    const handleClear = () => {
      handleFileSelect(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed rounded-lg transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            error && 'border-destructive'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Input
            ref={inputRef}
            type='file'
            accept={accept}
            onChange={handleInputChange}
            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
            {...props}
          />

          <div className='flex flex-col items-center justify-center p-6 text-center'>
            <Upload className='h-8 w-8 text-muted-foreground mb-2' />
            <p className='text-sm text-muted-foreground mb-2'>
              {selectedFile ? selectedFile.name : placeholder}
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleButtonClick}
              className='mt-2'
            >
              {buttonText}
            </Button>
            {selectedFile && showPreview && (
              <div className='mt-2 text-xs text-muted-foreground'>
                {formatFileSize(selectedFile.size)}
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className='flex items-center justify-between p-3 bg-muted rounded-md'>
            <div className='flex items-center space-x-2'>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>
                  {selectedFile.name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleClear}
              className='h-6 w-6 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}

        {error && <p className='text-sm text-destructive'>{error}</p>}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';

export { FileInput };
