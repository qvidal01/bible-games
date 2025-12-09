'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-16 w-16 border-4',
    lg: 'h-24 w-24 border-4',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full border-yellow-400 border-t-transparent ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {message && (
        <p className={`text-white mt-4 ${textSizes[size]}`}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}
