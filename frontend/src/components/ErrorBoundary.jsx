import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
