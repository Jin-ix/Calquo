/**
 * Clipboard Error Suppressor
 * Suppresses clipboard API errors that are caused by browser permissions policy
 */

// Suppress clipboard errors globally
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Suppress clipboard-related errors
  if (
    message.includes('Clipboard API has been blocked') ||
    message.includes('Failed to execute \'writeText\' on \'Clipboard\'') ||
    message.includes('NotAllowedError') && message.includes('Clipboard')
  ) {
    // Silently ignore clipboard errors - they're handled by fallback mechanisms
    return;
  }
  
  // Let other errors through
  originalError.apply(console, args);
};

// Suppress unhandled promise rejections for clipboard errors
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.toString() || '';
  
  if (
    message.includes('Clipboard API has been blocked') ||
    message.includes('Failed to execute \'writeText\' on \'Clipboard\'') ||
    (message.includes('NotAllowedError') && message.includes('Clipboard'))
  ) {
    // Prevent the error from being logged
    event.preventDefault();
  }
});

export {};
