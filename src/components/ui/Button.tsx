import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-[25px] text-sm font-medium tracking-wider uppercase transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'btn-glow px-8 py-4 text-base',
          variant === 'ghost' && 'hover:bg-white/10',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
