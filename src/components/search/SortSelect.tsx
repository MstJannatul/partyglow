import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ListingsSort } from '@/types/listings'

interface SortSelectProps {
  value?: ListingsSort
  onChange: (value: ListingsSort) => void
  className?: string
}

const options: { value: ListingsSort; label: string }[] = [
  { value: 'best_match', label: 'Best match' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Top rated' }
]

export function SortSelect({
  value = 'best_match',
  onChange,
  className
}: SortSelectProps) {
  return (
    <div className={className}>
      <Label className="mr-2 text-sm text-muted-foreground">Sort</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ListingsSort)}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
