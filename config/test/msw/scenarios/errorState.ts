import { http, HttpResponse, delay } from 'msw'

/**
 * Error state scenario handlers
 *
 * Use these handlers to simulate various API error conditions.
 * Useful for testing error handling, error boundaries, and fallback UI.
 */

type ErrorType = 'notFound' | 'serverError' | 'unauthorized' | 'forbidden' | 'badRequest' | 'timeout' | 'networkError'

const errorResponses: Record<ErrorType, { status: number; body: object }> = {
  notFound: {
    status: 404,
    body: { message: 'Resource not found', code: 404 },
  },
  serverError: {
    status: 500,
    body: { message: 'Internal server error', code: 500 },
  },
  unauthorized: {
    status: 401,
    body: { message: 'Unauthorized', code: 401 },
  },
  forbidden: {
    status: 403,
    body: { message: 'Forbidden', code: 403 },
  },
  badRequest: {
    status: 400,
    body: { message: 'Bad request', code: 400 },
  },
  timeout: {
    status: 408,
    body: { message: 'Request timeout', code: 408 },
  },
  networkError: {
    status: 503,
    body: { message: 'Service unavailable', code: 503 },
  },
}

/**
 * Create handlers that return errors for all endpoints
 */
export const createErrorHandlers = (GATEWAY_URL: string, errorType: ErrorType = 'serverError') => {
  const { status, body } = errorResponses[errorType]

  return [
    // Safe info error
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
      return HttpResponse.json(body, { status })
    }),

    // Balances error
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, () => {
      return HttpResponse.json(body, { status })
    }),

    // Collectibles error
    http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
      return HttpResponse.json(body, { status })
    }),

    // Transaction queue error
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, () => {
      return HttpResponse.json(body, { status })
    }),

    // Transaction history error
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
      return HttpResponse.json(body, { status })
    }),

    // Transaction details error
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
      return HttpResponse.json(body, { status })
    }),
  ]
}

/**
 * Create handlers for Safe not found (404)
 */
export const createSafeNotFoundHandlers = (GATEWAY_URL: string) => createErrorHandlers(GATEWAY_URL, 'notFound')

/**
 * Create handlers for server errors (500)
 */
export const createServerErrorHandlers = (GATEWAY_URL: string) => createErrorHandlers(GATEWAY_URL, 'serverError')

/**
 * Create handlers for unauthorized access (401)
 */
export const createUnauthorizedHandlers = (GATEWAY_URL: string) => createErrorHandlers(GATEWAY_URL, 'unauthorized')

/**
 * Create handlers that simulate network timeout
 */
export const createTimeoutHandlers = (GATEWAY_URL: string, delayMs = 30000) => [
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, async () => {
    await delay(delayMs)
    return HttpResponse.json({ message: 'Request timeout' }, { status: 408 })
  }),

  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, async () => {
    await delay(delayMs)
    return HttpResponse.json({ message: 'Request timeout' }, { status: 408 })
  }),

  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, async () => {
    await delay(delayMs)
    return HttpResponse.json({ message: 'Request timeout' }, { status: 408 })
  }),
]

/**
 * Create handlers for specific endpoint errors
 */
export const createPartialErrorHandlers = (
  GATEWAY_URL: string,
  failingEndpoints: Array<'balances' | 'transactions' | 'collectibles' | 'safe'>,
  errorType: ErrorType = 'serverError',
) => {
  const { status, body } = errorResponses[errorType]
  const handlers = []

  if (failingEndpoints.includes('safe')) {
    handlers.push(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
        return HttpResponse.json(body, { status })
      }),
    )
  }

  if (failingEndpoints.includes('balances')) {
    handlers.push(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, () => {
        return HttpResponse.json(body, { status })
      }),
    )
  }

  if (failingEndpoints.includes('transactions')) {
    handlers.push(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`, () => {
        return HttpResponse.json(body, { status })
      }),
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
        return HttpResponse.json(body, { status })
      }),
    )
  }

  if (failingEndpoints.includes('collectibles')) {
    handlers.push(
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
        return HttpResponse.json(body, { status })
      }),
    )
  }

  return handlers
}
