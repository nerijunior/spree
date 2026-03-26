import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { createWebhookHandler } from '../src/webhooks'

function sign(payload: string, secret: string, timestamp: number): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
}

function buildRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/webhooks/spree', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  })
}

const SECRET = 'test_webhook_secret_key'

function signedRequest(payload: object, timestamp?: number) {
  const ts = timestamp ?? Math.floor(Date.now() / 1000)
  const body = JSON.stringify(payload)
  const signature = sign(body, SECRET, ts)

  return buildRequest(body, {
    'x-spree-webhook-signature': signature,
    'x-spree-webhook-timestamp': String(ts),
    'x-spree-webhook-event': (payload as any).name || '',
  })
}

describe('createWebhookHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const orderPayload = {
    id: 'evt_123',
    name: 'order.completed',
    created_at: '2026-01-15T12:00:00Z',
    data: { number: 'R123', email: 'test@example.com' },
    metadata: { spree_version: '5.4.0' },
  }

  it('dispatches to the correct handler and returns 200', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': handler },
    })

    const response = await POST(signedRequest(orderPayload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ received: true, handled: true })
    expect(handler).toHaveBeenCalledWith(orderPayload)
  })

  it('returns 200 with handled: false for unhandled events', async () => {
    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: {},
    })

    const response = await POST(signedRequest(orderPayload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ received: true, handled: false })
  })

  it('returns 401 when signature is missing', async () => {
    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': vi.fn() },
    })

    const request = buildRequest(JSON.stringify(orderPayload))
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 401 when signature is invalid', async () => {
    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': vi.fn() },
    })

    const ts = Math.floor(Date.now() / 1000)
    const request = buildRequest(JSON.stringify(orderPayload), {
      'x-spree-webhook-signature': 'invalid',
      'x-spree-webhook-timestamp': String(ts),
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': vi.fn() },
    })

    const body = 'not-json'
    const ts = Math.floor(Date.now() / 1000)
    const signature = sign(body, SECRET, ts)

    const request = buildRequest(body, {
      'x-spree-webhook-signature': signature,
      'x-spree-webhook-timestamp': String(ts),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 500 when secret is empty', async () => {
    const POST = createWebhookHandler({
      secret: '',
      handlers: { 'order.completed': vi.fn() },
    })

    const response = await POST(signedRequest(orderPayload))

    expect(response.status).toBe(500)
  })

  it('awaits handler when no waitUntil is provided', async () => {
    const order: string[] = []
    const handler = vi.fn(async () => {
      order.push('handler')
    })

    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': handler },
    })

    await POST(signedRequest(orderPayload))
    order.push('after-response')

    expect(order).toEqual(['handler', 'after-response'])
  })

  it('uses waitUntil when provided and returns before handler completes', async () => {
    let scheduledPromise: Promise<unknown> | null = null
    const waitUntil = vi.fn((p: Promise<unknown>) => { scheduledPromise = p })

    const handler = vi.fn(async () => {
      // simulate slow work
    })

    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': handler },
      waitUntil,
    })

    const response = await POST(signedRequest(orderPayload))

    expect(response.status).toBe(200)
    expect(waitUntil).toHaveBeenCalledOnce()
    expect(scheduledPromise).toBeInstanceOf(Promise)

    // Resolve the background work
    await scheduledPromise
    expect(handler).toHaveBeenCalledWith(orderPayload)
  })

  it('uses event name from header over payload', async () => {
    const completedHandler = vi.fn().mockResolvedValue(undefined)
    const canceledHandler = vi.fn().mockResolvedValue(undefined)

    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: {
        'order.completed': completedHandler,
        'order.canceled': canceledHandler,
      },
    })

    // Payload says completed, but header overrides to canceled
    const ts = Math.floor(Date.now() / 1000)
    const body = JSON.stringify(orderPayload)
    const signature = sign(body, SECRET, ts)

    const request = buildRequest(body, {
      'x-spree-webhook-signature': signature,
      'x-spree-webhook-timestamp': String(ts),
      'x-spree-webhook-event': 'order.canceled',
    })

    await POST(request)

    expect(canceledHandler).toHaveBeenCalled()
    expect(completedHandler).not.toHaveBeenCalled()
  })

  it('logs handler errors without failing the response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = vi.fn().mockRejectedValue(new Error('email send failed'))

    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': handler },
    })

    const response = await POST(signedRequest(orderPayload))

    expect(response.status).toBe(200)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('order.completed'),
      expect.any(Error),
    )

    consoleSpy.mockRestore()
  })

  it('respects custom tolerance', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)

    const POST = createWebhookHandler({
      secret: SECRET,
      handlers: { 'order.completed': handler },
      toleranceSeconds: 10,
    })

    // Timestamp is 30 seconds old — outside 10s tolerance
    const oldTs = Math.floor(Date.now() / 1000) - 30
    const response = await POST(signedRequest(orderPayload, oldTs))

    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})
