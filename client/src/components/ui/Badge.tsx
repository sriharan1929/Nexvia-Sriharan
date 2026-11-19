import * as React from 'react';
import { cn } from '../../lib/utils';

function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
}) {
  const variants = {
    default: 'bg-[#282C3F] text-white',
    secondary: 'bg-[#F5F5F6] text-[#535766] border border-[#E9E9ED]',
    success: 'bg-[#E8F8F5] text-[#03A685]',
    warning: 'bg-orange-50 text-[#FF905A]',
    danger: 'bg-red-50 text-red-600',
    outline: 'border border-[#E9E9ED] text-[#535766] bg-transparent',
  };
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xs px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

