import toast from 'react-hot-toast';

export const showToast = {
  // Success messages with professional formatting
  success: (message: string, options?: any) => {
    toast.success(message, {
      ...options,
      style: {
        background: 'white',
        color: '#065f46',
        border: '1px solid #10b981',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: 'white',
      },
    });
  },

  // Error messages with professional formatting
  error: (message: string, options?: any) => {
    toast.error(message, {
      ...options,
      style: {
        background: 'white',
        color: '#991b1b',
        border: '1px solid #ef4444',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: 'white',
      },
    });
  },

  // Loading messages with professional formatting
  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      ...options,
      style: {
        background: 'white',
        color: '#1e3a8a',
        border: '1px solid #3b82f6',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: 'white',
      },
    });
  },

  // Info messages with professional formatting
  info: (message: string, options?: any) => {
    toast(message, {
      ...options,
      icon: 'ℹ️',
      style: {
        background: 'white',
        color: '#1e3a8a',
        border: '1px solid #60a5fa',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
      },
    });
  },

  // Warning messages with professional formatting
  warning: (message: string, options?: any) => {
    toast(message, {
      ...options,
      icon: '⚠️',
      style: {
        background: 'white',
        color: '#92400e',
        border: '1px solid #fbbf24',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
      },
    });
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: any
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...options,
        style: {
          background: 'white',
          color: '#374151',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          maxWidth: '420px',
        },
      }
    );
  },

  // Dismiss toast
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  // Custom toast with full control
  custom: (render: (t: any) => JSX.Element, options?: any) => {
    toast.custom(render, options);
  },
};

// Common toast messages for consistency
export const toastMessages = {
  // Success messages
  saved: 'Changes saved successfully',
  created: 'Created successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  copied: 'Copied to clipboard',
  connected: 'Connected successfully',

  // Error messages
  error: 'An error occurred. Please try again.',
  networkError: 'Network error. Please check your connection.',
  authError: 'Authentication required. Please sign in.',
  permissionError: 'You don\'t have permission to perform this action.',
  validationError: 'Please check your input and try again.',

  // Loading messages
  loading: 'Loading...',
  saving: 'Saving changes...',
  processing: 'Processing...',
  connecting: 'Connecting...',

  // Info messages
  info: 'Please note this information',
  comingSoon: 'This feature is coming soon',

  // Warning messages
  warning: 'Please proceed with caution',
  unsavedChanges: 'You have unsaved changes',
};