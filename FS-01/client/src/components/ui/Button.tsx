import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold tracking-wide text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-sm',
  {
    variants: {
      variant: {
        primary:
          'bg-[#FF3F6C] text-white hover:bg-[#e0325d] shadow-sm active:scale-[0.99] focus-visible:ring-[#FF3F6C]',
        secondary:
          'bg-[#F5F5F6] text-[#282C3F] hover:bg-[#E9E9ED] border border-[#E9E9ED] focus-visible:ring-[#282C3F]',
        outline:
          'bg-white border border-[#d4d5d9] text-[#282C3F] hover:border-[#282C3F] focus-visible:ring-[#282C3F]',
        ghost:
          'text-[#282C3F] hover:bg-[#F5F5F6] focus-visible:ring-[#282C3F]',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        link:
          'text-[#FF3F6C] underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-sm uppercase',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
