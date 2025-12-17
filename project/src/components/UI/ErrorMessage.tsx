import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-900 bg-opacity-90 text-white p-4 rounded-lg border border-red-500">
      <div className="flex items-center space-x-2 mb-2">
        <AlertCircle size={20} />
        <span className="font-semibold">Error</span>
      </div>
      <p className="text-sm mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};