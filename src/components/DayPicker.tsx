const DAYS = [
  { label: 'M', bit: 1 },
  { label: 'T', bit: 2 },
  { label: 'W', bit: 4 },
  { label: 'T', bit: 8 },
  { label: 'F', bit: 16 },
  { label: 'S', bit: 32 },
  { label: 'S', bit: 64 },
]

interface DayPickerProps {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
}

export default function DayPicker({ value, onChange, readonly }: DayPickerProps) {
  const toggle = (bit: number) => {
    if (readonly) return
    onChange(value ^ bit)
  }

  return (
    <div className="flex gap-1.5">
      {DAYS.map((day) => {
        const isActive = (value & day.bit) !== 0
        return (
          <button
            key={day.bit}
            type="button"
            onClick={() => toggle(day.bit)}
            disabled={readonly}
            className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
