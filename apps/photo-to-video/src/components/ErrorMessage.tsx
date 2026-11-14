interface ErrorMessageProps {
  title?: string;
  message: string | null;
}

export default function ErrorMessage({ title, message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      {title && <strong>{title}: </strong>}
      {message}
    </div>
  );
}
