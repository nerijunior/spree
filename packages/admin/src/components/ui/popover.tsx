import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import * as React from 'react'
import { cn } from '@/lib/utils'

function Popover({
  children,
  ...props
}: {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, eventDetails: PopoverPrimitive.Root.ChangeEventDetails) => void
  modal?: boolean
}) {
  return (
    <PopoverPrimitive.Root data-slot="popover" {...props}>
      {children}
    </PopoverPrimitive.Root>
  )
}

function PopoverTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger> & {
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger data-slot="popover-trigger" render={children} {...props} />
    )
  }
  return (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
      {children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  side = 'bottom',
  children,
  ...props
}: {
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  side?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
} & Omit<React.ComponentProps<typeof PopoverPrimitive.Popup>, 'className'>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'z-50 w-auto rounded-lg bg-white p-3 text-foreground shadow-[0px_0px_0px_1px_rgba(179,179,179,0.5),0px_6px_12px_-3px_rgba(179,179,179,0.35),0px_6px_18px_0px_rgba(179,179,179,0.35)]',
            'duration-100 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-[opacity,transform]',
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<'div'>) {
  return <div data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
