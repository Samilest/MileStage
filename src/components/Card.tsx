import { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void | Promise<void>;
}

function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-6 ${hover ? 'shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default memo(Card);
