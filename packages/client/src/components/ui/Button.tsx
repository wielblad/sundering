import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-r from-mystical-600 to-mystical-500
            text-white font-semibold
            hover:from-mystical-500 hover:to-mystical-400
            shadow-lg shadow-mystical-500/25
            hover:shadow-xl hover:shadow-mystical-500/40
            active:scale-95`,
  secondary: `bg-transparent border-2 border-human-500
              text-human-400 font-semibold
              hover:bg-human-500/10 hover:text-human-300`,
  ghost: `bg-transparent text-gray-400
          hover:text-white hover:bg-white/5`,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-6 py-3 text-base rounded-lg',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          inline-flex items-center justify-center gap-2
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
