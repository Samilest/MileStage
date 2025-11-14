import {
  Palette,
  Code,
  Camera,
} from 'lucide-react';

interface TemplateIconProps {
  type: 'graphic-brand-design' | 'web-design-development' | 'content-creation';
  className?: string;
}

export default function TemplateIcon({ type, className = 'w-20 h-20' }: TemplateIconProps) {
  const iconMap = {
    'graphic-brand-design': Palette,
    'web-design-development': Code,
    'content-creation': Camera,
  };

  const Icon = iconMap[type];

  return (
    <div className={`${className} bg-black rounded-full flex items-center justify-center`}>
      <Icon className="w-[45%] h-[45%] text-white group-hover:text-green-400 transition-colors duration-300 ease-in-out" strokeWidth={2} />
    </div>
  );
}
