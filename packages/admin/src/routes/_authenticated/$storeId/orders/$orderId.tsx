import type { Order, Variant } from '@spree/admin-sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AddressBlock } from '@/components/address-block'
import { AddressFormDialog, type AddressParams } from '@/components/address-form-dialog'
import { BackButton } from '@/components/back-button'
import {
  CreditCardIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
  XCircleIcon,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useConfirm } from '@/components/confirm-dialog'
import { adminClient } from '@/client'
import { formatRelativeTime } from '@/lib/formatters'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/$storeId/orders/$orderId')({
  component: OrderDetailPage,
})

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------

function useOrder(orderId: string) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () =>
      adminClient.orders.get(orderId, {
        expand: [
          'items',
          'fulfillments',
          'fulfillments.delivery_method',
          'fulfillments.stock_location',
          'payments',
          'payments.payment_method',
          'billing_address',
          'shipping_address',
          'customer',
        ],
      }),
    enabled: isAuthenticated,
  })
}

/** Wrapper for mutations that invalidate the order query on success */
function useOrderMutation<TParams>(
  orderId: string,
  mutationFn: (params: TParams) => Promise<unknown>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const { data: order, isLoading, error } = useOrder(orderId)

  if (isLoading) return <OrderSkeleton />
  if (error || !order) return <p className="text-destructive">Failed to load order {orderId}.</p>

  return (
    <div className="flex flex-col gap-6">
      <OrderHeader order={order} />

      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <LineItemsCard order={order} />
          <ShipmentsCard order={order} />
          <PaymentsCard order={order} />
          <OrderSummaryCard order={order} />
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <CustomerCard order={order} />
          <SpecialInstructionsCard order={order} />
          <InternalNoteCard order={order} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function OrderHeader({ order }: { order: Order }) {
  const { orderId } = Route.useParams()
  const confirm = useConfirm()

  const backFallback = order.completed_at ? 'orders' : 'orders/drafts'

  const cancelMutation = useOrderMutation(orderId, () =>
    adminClient.orders.cancel(orderId, {}),
  )
  const resendMutation = useOrderMutation(orderId, () =>
    adminClient.orders.resendConfirmation(orderId, {}),
  )

  return (
    <div className="flex items-center gap-3">
      <BackButton fallback={backFallback} />

      <h1 className="text-2xl font-medium">{order.number}</h1>

      {order.payment_status && <StatusBadge status={order.payment_status} />}
      {order.fulfillment_status && <StatusBadge status={order.fulfillment_status} />}

      {order.completed_at && (
        <span className="text-sm text-muted-foreground">
          Completed {order.completed_at ? formatRelativeTime(order.completed_at) : ''}
        </span>
      )}

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="outline">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {order.completed_at && (
              <>
                <DropdownMenuItem>
                  <ExternalLinkIcon className="size-4" />
                  Preview Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => resendMutation.mutate(undefined)}
                  disabled={resendMutation.isPending}
                >
                  <MailIcon className="size-4" />
                  Resend Confirmation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {(order as any).state !== 'canceled' && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (await confirm({ message: 'Are you sure you want to cancel this order?', variant: 'destructive', confirmLabel: 'Cancel Order' })) {
                    cancelMutation.mutate(undefined)
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                <XCircleIcon className="size-4" />
                Cancel Order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Line Items
// ---------------------------------------------------------------------------

function AddLineItemDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [search, setSearch] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [quantity, setQuantity] = useState(1)

  const { data: variantsData } = useQuery({
    queryKey: ['variants', 'search', search],
    queryFn: () => adminClient.variants.list({ search, limit: 10 }),
    enabled: search.length >= 3,
    staleTime: 30_000,
  })

  const variants = variantsData?.data ?? []

  const mutation = useOrderMutation(orderId, (params: { variant_id: string; quantity: number }) =>
    adminClient.orders.lineItems.create(orderId, params),
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedVariant) return
    mutation.mutate(
      { variant_id: selectedVariant.id, quantity },
      {
        onSuccess: () => {
          onOpenChange(false)
          setSelectedVariant(null)
          setSearch('')
          setQuantity(1)
        },
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => onOpenChange(o as boolean)}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add Line Item</SheetTitle>
          <SheetDescription>Search for a product variant to add to this order.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Search variant</FieldLabel>
                <Input
                  placeholder="Type product name or SKU (min 3 chars)..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedVariant(null)
                  }}
                  autoFocus
                />
                {search.length >= 3 && variants.length > 0 && !selectedVariant && (
                  <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-xs max-h-[280px] overflow-y-auto">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v)
                          setSearch('')
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{v.product_name ?? v.sku}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.options_text && <span>{v.options_text} · </span>}
                            SKU: {v.sku || '—'}
                          </div>
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {v.display_price ?? ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {search.length >= 3 && variants.length === 0 && !selectedVariant && (
                  <p className="mt-1 text-xs text-muted-foreground">No variants found</p>
                )}
              </Field>

              {selectedVariant && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{selectedVariant.product_name ?? selectedVariant.sku}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedVariant.options_text && <span>{selectedVariant.options_text} · </span>}
                      SKU: {selectedVariant.sku || '—'} · {selectedVariant.display_price ?? ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVariant(null)}
                    className="p-1 rounded hover:bg-blue-100 text-blue-600"
                  >
                    <XCircleIcon className="size-4" />
                  </button>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedVariant || mutation.isPending}>
              {mutation.isPending ? 'Adding…' : 'Add Item'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EditQuantityDialog({
  orderId,
  lineItemId,
  currentQuantity,
  open,
  onOpenChange,
}: {
  orderId: string
  lineItemId: string
  currentQuantity: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {

  const mutation = useOrderMutation(orderId, (params: { quantity: number }) =>
    adminClient.orders.lineItems.update(orderId, lineItemId, params),
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate(
      { quantity: Number(fd.get('quantity')) || 1 },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Quantity</DialogTitle>
          <DialogDescription>Update the quantity for this line item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-quantity">Quantity</FieldLabel>
                <Input
                  id="edit-quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={currentQuantity}
                />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LineItemsCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()
  const confirm = useConfirm()

  const items = order.items ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<{ id: string; quantity: number } | null>(null)

  const deleteMutation = useOrderMutation(orderId, (lineItemId: string) =>
    adminClient.orders.lineItems.delete(orderId, lineItemId),
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <ShoppingCartIcon className="size-4" />
            Line Items
            {items.length > 0 && <Badge>{items.length}</Badge>}
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Add Item
            </Button>
          </CardAction>
        </CardHeader>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="p-3 pl-5 text-left font-normal">Item</th>
                  <th className="p-3 text-right font-normal">Price</th>
                  <th className="p-3 text-right font-normal">Qty</th>
                  <th className="p-3 text-right font-normal">Tax</th>
                  <th className="p-3 text-right font-normal">Discount</th>
                  <th className="p-3 text-right font-normal">Total</th>
                  <th className="p-3 pr-5 w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.name}
                            className="size-10 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <PackageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.name}</div>
                          {item.options_text && (
                            <div className="truncate text-xs text-muted-foreground">
                              {item.options_text}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">{item.display_price}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {item.display_additional_tax_total}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {Number.parseFloat(item.discount_total) !== 0 ? item.display_discount_total : '—'}
                    </td>
                    <td className="p-3 text-right font-medium whitespace-nowrap">
                      {item.display_total}
                    </td>
                    <td className="p-3 pr-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs">
                            <EllipsisVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditItem({ id: item.id, quantity: item.quantity })}
                          >
                            <PencilIcon className="size-4" />
                            Edit Quantity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                              if (await confirm({ message: 'Remove this item from the order?', variant: 'destructive', confirmLabel: 'Remove' })) {
                                deleteMutation.mutate(item.id)
                              }
                            }}
                          >
                            <TrashIcon className="size-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CardContent>
            <p className="text-center text-muted-foreground py-8">No line items</p>
          </CardContent>
        )}
      </Card>

      <AddLineItemDialog orderId={orderId} open={addOpen} onOpenChange={setAddOpen} />

      {editItem && (
        <EditQuantityDialog
          orderId={orderId}
          lineItemId={editItem.id}
          currentQuantity={editItem.quantity}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

function EditTrackingDialog({
  orderId,
  fulfillmentId,
  currentTracking,
  open,
  onOpenChange,
}: {
  orderId: string
  fulfillmentId: string
  currentTracking: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {

  const mutation = useOrderMutation(orderId, (params: { tracking: string }) =>
    adminClient.orders.fulfillments.update(orderId, fulfillmentId, params),
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate(
      { tracking: fd.get('tracking') as string },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tracking</DialogTitle>
          <DialogDescription>Update the tracking number for this fulfillment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tracking">Tracking Number</FieldLabel>
                <Input id="tracking" name="tracking" defaultValue={currentTracking ?? ''} />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ShipmentsCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()
  const confirm = useConfirm()

  const fulfillments = order.fulfillments ?? []
  const [editTracking, setEditTracking] = useState<{
    id: string
    tracking: string | null
  } | null>(null)

  const fulfillMutation = useOrderMutation(orderId, (fulfillmentId: string) =>
    adminClient.orders.fulfillments.fulfill(orderId, fulfillmentId, {}),
  )
  const cancelFulfillmentMutation = useOrderMutation(orderId, (fulfillmentId: string) =>
    adminClient.orders.fulfillments.cancel(orderId, fulfillmentId, {}),
  )

  if (fulfillments.length === 0) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <TruckIcon className="size-4" />
            Fulfillments
            <Badge>{fulfillments.length}</Badge>
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            {order.fulfillment_status && <StatusBadge status={order.fulfillment_status} />}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {fulfillments.map((fulfillment) => (
            <div key={fulfillment.id} className="rounded-lg border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={fulfillment.status} />
                  <span className="text-sm font-medium">{fulfillment.number}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-xs">
                      <EllipsisVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        setEditTracking({ id: fulfillment.id, tracking: fulfillment.tracking })
                      }
                    >
                      <PencilIcon className="size-4" />
                      {fulfillment.tracking ? 'Edit Tracking' : 'Add Tracking'}
                    </DropdownMenuItem>
                    {fulfillment.status === 'ready' && (
                      <DropdownMenuItem
                        onClick={async () => {
                          if (await confirm({ message: 'Ship this fulfillment?', variant: 'default', confirmLabel: 'Fulfill' })) {
                            fulfillMutation.mutate(fulfillment.id)
                          }
                        }}
                      >
                        <TruckIcon className="size-4" />
                        Ship
                      </DropdownMenuItem>
                    )}
                    {['pending', 'ready'].includes(fulfillment.status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={async () => {
                            if (await confirm({ message: 'Cancel this fulfillment?', variant: 'destructive', confirmLabel: 'Cancel Fulfillment' })) {
                              cancelFulfillmentMutation.mutate(fulfillment.id)
                            }
                          }}
                        >
                          <XCircleIcon className="size-4" />
                          Cancel Shipment
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {fulfillment.delivery_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{fulfillment.delivery_method.name}</span>
                  <span>{fulfillment.display_cost}</span>
                </div>
              )}

              {fulfillment.stock_location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3" />
                  {fulfillment.stock_location.name}
                </div>
              )}

              {fulfillment.tracking && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Tracking: </span>
                  {fulfillment.tracking_url ? (
                    <a
                      href={fulfillment.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {fulfillment.tracking}
                    </a>
                  ) : (
                    <span>{fulfillment.tracking}</span>
                  )}
                </div>
              )}

              {fulfillment.fulfilled_at && (
                <span className="text-xs text-muted-foreground">
                  Shipped {fulfillment.fulfilled_at ? formatRelativeTime(fulfillment.fulfilled_at) : ''}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {editTracking && (
        <EditTrackingDialog
          orderId={orderId}
          fulfillmentId={editTracking.id}
          currentTracking={editTracking.tracking}
          open={!!editTracking}
          onOpenChange={(open) => !open && setEditTracking(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

function PaymentsCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()
  const confirm = useConfirm()

  const payments = order.payments ?? []

  const captureMutation = useOrderMutation(orderId, (paymentId: string) =>
    adminClient.orders.payments.capture(orderId, paymentId, {}),
  )
  const voidMutation = useOrderMutation(orderId, (paymentId: string) =>
    adminClient.orders.payments.void(orderId, paymentId, {}),
  )

  if (payments.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CreditCardIcon className="size-4" />
          Payments
          <Badge>{payments.length}</Badge>
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          {order.payment_status && <StatusBadge status={order.payment_status} />}
        </CardAction>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="p-3 pl-5 text-left font-normal">Number</th>
              <th className="p-3 text-left font-normal">Method</th>
              <th className="p-3 text-left font-normal">State</th>
              <th className="p-3 text-right font-normal">Amount</th>
              <th className="p-3 pr-5 w-10" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b last:border-b-0">
                <td className="p-3 pl-5 font-medium">{payment.number}</td>
                <td className="p-3 text-muted-foreground">{payment.payment_method?.name ?? '—'}</td>
                <td className="p-3">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="p-3 text-right font-medium whitespace-nowrap">
                  {payment.display_amount}
                </td>
                <td className="p-3 pr-5">
                  {(payment.status === 'checkout' ||
                    payment.status === 'pending' ||
                    payment.status === 'completed') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <EllipsisVerticalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(payment.status === 'checkout' || payment.status === 'pending') && (
                          <DropdownMenuItem
                            onClick={async () => {
                              if (await confirm({ message: 'Capture this payment?', variant: 'default', confirmLabel: 'Capture' })) {
                                captureMutation.mutate(payment.id)
                              }
                            }}
                          >
                            <CreditCardIcon className="size-4" />
                            Capture
                          </DropdownMenuItem>
                        )}
                        {(payment.status === 'checkout' ||
                          payment.status === 'pending' ||
                          payment.status === 'completed') && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                              if (await confirm({ message: 'Void this payment?', variant: 'destructive', confirmLabel: 'Void Payment' })) {
                                voidMutation.mutate(payment.id)
                              }
                            }}
                          >
                            <XCircleIcon className="size-4" />
                            Void
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Order Summary
// ---------------------------------------------------------------------------

function SummaryRow({
  label,
  value,
  bold,
  danger,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  danger?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={cn('flex items-center justify-between px-5 py-2.5', highlight && 'bg-muted/50')}
    >
      <span className="text-sm">{label}</span>
      <span className={cn('text-sm', bold && 'font-bold', danger && 'text-destructive')}>
        {value}
      </span>
    </div>
  )
}

function OrderSummaryCard({ order }: { order: Order }) {
  const outstandingBalance = Number.parseFloat(order.total) - Number.parseFloat(order.payment_total)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <div className="py-1">
        {order.completed_at && (
          <>
            <SummaryRow label="Completed" value={formatDate(order.completed_at)} />
            {order.canceled_at && (
              <SummaryRow label="Canceled" value={formatDate(order.canceled_at)} />
            )}
            <Separator />
          </>
        )}

        <SummaryRow label="Locale" value={order.locale ?? '—'} />
        <SummaryRow label="Currency" value={order.currency} />

        <Separator />

        <SummaryRow label="Subtotal" value={order.display_item_total} />

        {Number.parseFloat(order.delivery_total) > 0 && (
          <SummaryRow label="Shipping" value={order.display_delivery_total} />
        )}

        {Number.parseFloat(order.discount_total) !== 0 && (
          <SummaryRow label="Promotions" value={order.display_discount_total} />
        )}

        {Number.parseFloat(order.adjustment_total) !== 0 && (
          <SummaryRow label="Adjustments" value={order.display_adjustment_total} />
        )}

        {Number.parseFloat(order.included_tax_total) > 0 && (
          <SummaryRow label="Tax (included)" value={order.display_included_tax_total} />
        )}

        {Number.parseFloat(order.additional_tax_total) > 0 && (
          <SummaryRow label="Tax (additional)" value={order.display_additional_tax_total} />
        )}

        <Separator />

        <SummaryRow label="Total" value={order.display_total} bold />

        <Separator />

        <SummaryRow label="Payment total" value={order.display_payment_total} highlight />
        <SummaryRow
          label="Outstanding balance"
          value={`${order.currency} ${Math.abs(outstandingBalance).toFixed(2)}`}
          highlight
          danger={outstandingBalance > 0}
        />
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Customer Sidebar
// ---------------------------------------------------------------------------

function CustomerCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()
  const queryClient = useQueryClient()
  const user = order.customer
  const [editAddress, setEditAddress] = useState<'shipping_address' | 'billing_address' | null>(null)

  const addressMutation = useMutation({
    mutationFn: (params: { type: 'shipping_address' | 'billing_address'; address: AddressParams }) =>
      adminClient.orders.update(orderId, { [params.type]: params.address } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      setEditAddress(null)
    },
  })

  const editTitle = editAddress === 'shipping_address' ? 'Edit Shipping Address' : 'Edit Billing Address'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <EllipsisVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditAddress('shipping_address')}>
                  <PencilIcon className="size-4" />
                  Edit Shipping Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditAddress('billing_address')}>
                  <PencilIcon className="size-4" />
                  Edit Billing Address
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Contact info */}
          {user ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-xs font-medium">
                {[user.first_name, user.last_name]
                  .filter(Boolean)
                  .map((n) => n![0])
                  .join('')
                  .toUpperCase() || user.email[0]!.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          ) : order.email ? (
            <div className="text-sm text-blue-600">{order.email}</div>
          ) : (
            <span className="text-sm text-muted-foreground">No customer information</span>
          )}

          <AddressBlock title="Shipping Address" address={order.shipping_address} />
          <AddressBlock title="Billing Address" address={order.billing_address} />
        </CardContent>
      </Card>

      {editAddress && (
        <AddressFormDialog
          title={editTitle}
          address={editAddress === 'shipping_address' ? order.shipping_address : order.billing_address}
          open={!!editAddress}
          onOpenChange={(open) => !open && setEditAddress(null)}
          onSave={(address) => addressMutation.mutate({ type: editAddress, address })}
          isPending={addressMutation.isPending}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Special Instructions
// ---------------------------------------------------------------------------

function SpecialInstructionsCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()

  const [editing, setEditing] = useState(false)
  const mutation = useOrderMutation(orderId, (params: { customer_note: string }) =>
    adminClient.orders.update(orderId, params),
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate(
      { customer_note: fd.get('customer_note') as string },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Instructions</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(!editing)}>
            <PencilIcon className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea name="customer_note" defaultValue={order.customer_note ?? ''} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        ) : order.customer_note ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {order.customer_note}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Internal Note
// ---------------------------------------------------------------------------

function InternalNoteCard({ order }: { order: Order }) {
  const { orderId } = Route.useParams()

  const [editing, setEditing] = useState(false)
  const mutation = useOrderMutation(orderId, (params: { internal_note: string }) =>
    adminClient.orders.update(orderId, params),
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate(
      { internal_note: fd.get('internal_note') as string },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Note</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(!editing)}>
            <PencilIcon className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea name="internal_note" defaultValue={order.internal_note ?? ''} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        ) : order.internal_note ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.internal_note}</p>
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function OrderSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
