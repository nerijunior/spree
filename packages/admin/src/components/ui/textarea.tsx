import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-base font-normal leading-normal text-gray-950 shadow-xs transition-all duration-100 ease-in-out outline-none placeholder:text-gray-500 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-100 disabled:text-gray-600 disabled:shadow-none aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
