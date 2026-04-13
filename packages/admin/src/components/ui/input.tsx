import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'block w-full min-w-0 rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-base font-normal leading-normal text-gray-950 shadow-xs transition-all duration-100 ease-in-out outline-none placeholder:text-gray-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-100 disabled:text-gray-600 disabled:shadow-none aria-invalid:border-destructive file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
