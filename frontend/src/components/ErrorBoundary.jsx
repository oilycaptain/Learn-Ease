import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Optional: log to your backend
    console.error('Quiz ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-700 mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700">
              The quiz screen hit an unexpected error. Try going back or refreshing the page.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
