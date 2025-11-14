import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base transform hover:scale-105 active:scale-95';

  const variants = {
    primary: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 hover:shadow-lg',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-gray-400 focus:ring-gray-300 hover:shadow-md transition-colors',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 hover:shadow-lg',
    link: 'text-green-600 hover:text-green-700 underline px-0 py-0 font-normal min-h-0 hover:scale-100'
  };

  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-current disabled:hover:scale-100 disabled:hover:shadow-none';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
