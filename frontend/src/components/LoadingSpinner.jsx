export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center">
          <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 mx-auto`}></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600`}></div>
    </div>
  );
}
