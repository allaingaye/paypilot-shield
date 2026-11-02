import { AlertCircle } from "lucide-react";
import Button from "./Button";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E6E7E8] rounded-xl shadow-sm text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-black mb-1">
        Something went wrong
      </h3>
      
      <p className="text-sm text-[#686A6D] max-w-md mx-auto mb-6">
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}