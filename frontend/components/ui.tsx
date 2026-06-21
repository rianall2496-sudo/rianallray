import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-chaebol-800 border border-chaebol-700 rounded-xl p-4 shadow-lg ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
}> = ({ onClick, children, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-chaebol-700 hover:bg-slate-600 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'info' | 'success' | 'warning' }> = ({ children, variant = 'info' }) => {
  const variants = {
    info: "bg-blue-900 text-blue-200 border-blue-700",
    success: "bg-green-900 text-green-200 border-green-700",
    warning: "bg-yellow-900 text-yellow-200 border-yellow-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
};
