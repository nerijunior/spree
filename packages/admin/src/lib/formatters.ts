import { formatDistanceToNow } from 'date-fns'

export function formatPrice(
  price: { amount?: string; currency?: string; display?: string } | null,
) {
  if (!price) return '—'
  return price.display ?? `${price.currency} ${price.amount}`
}

export function formatRelativeTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}
