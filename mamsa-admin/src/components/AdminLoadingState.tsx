'use client';

interface AdminLoadingStateProps {
  message?: string;
  subMessage?: string;
}

export default function AdminLoadingState({ 
  message = 'Loading content...', 
  subMessage = 'Please wait while we fetch the latest data' 
}: AdminLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <div className="relative">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        {/* Pulse effect */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-100 rounded-full animate-ping opacity-20"></div>
      </div>
      
      <div className="mt-6 text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <p className="text-sm text-gray-600 max-w-md">{subMessage}</p>
      </div>
      
      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

