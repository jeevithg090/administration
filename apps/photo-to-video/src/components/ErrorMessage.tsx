import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string | null;
}

export default function ErrorMessage({ title, message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle size={18} aria-hidden />
      <div>
        {title && <span className="alert-title">{title}</span>}
        {message}
      </div>
    </div>
  );
}
