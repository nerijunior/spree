import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { format, subDays, subHours, subMonths } from 'date-fns'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DateRange {
  from: Date
  to: Date
}

interface Preset {
  label: string
  value: () => DateRange
}

const presets: Preset[] = [
  { label: 'Last 24 hours', value: () => ({ from: subHours(new Date(), 24), to: new Date() }) },
  { label: 'Last 7 days', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Last 3 months', value: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState<'presets' | 'custom'>('presets')
  const [customRange, setCustomRange] = useState<DayPickerDateRange | undefined>({
    from: value.from,
    to: value.to,
  })

  const activePresetLabel = useMemo(() => {
    const now = new Date()
    const diffMs = now.getTime() - value.from.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours <= 25) return 'Last 24 hours'
    if (diffDays <= 8) return 'Last 7 days'
    if (diffDays <= 31) return 'Last 30 days'
    if (diffDays <= 92) return 'Last 3 months'
    return `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`
  }, [value])

  function handlePreset(preset: Preset) {
    onChange(preset.value())
    setOpen(false)
    setSelecting('presets')
  }

  function handleCustomApply() {
    if (customRange?.from && customRange?.to) {
      onChange({ from: customRange.from, to: customRange.to })
      setOpen(false)
      setSelecting('presets')
    }
  }

  const displayRange = customRange?.from && customRange?.to
    ? `${format(customRange.from, 'MMM d, yyyy')} – ${format(customRange.to, 'MMM d, yyyy')}`
    : customRange?.from
      ? `${format(customRange.from, 'MMM d, yyyy')} – ...`
      : 'Select start and end dates'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 text-sm font-normal">
          <CalendarIcon className="size-3.5" />
          {activePresetLabel}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        {selecting === 'presets' ? (
          <div className="flex flex-col">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset)}
                className="px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg"
              >
                {preset.label}
              </button>
            ))}
            <div className="border-t" />
            <button
              type="button"
              onClick={() => {
                setSelecting('custom')
                setCustomRange({ from: value.from, to: value.to })
              }}
              className="px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors rounded-b-lg"
            >
              Custom range...
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <div className="text-sm font-medium">Select date range</div>
            <Calendar
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={setCustomRange}
              numberOfMonths={2}
            />
            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {displayRange}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelecting('presets')}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!customRange?.from || !customRange?.to}
                  onClick={handleCustomApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
