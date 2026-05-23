type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-white border border-rose-100 rounded-2xl p-8 text-center">
      <p className="text-rose-600 font-bold mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
