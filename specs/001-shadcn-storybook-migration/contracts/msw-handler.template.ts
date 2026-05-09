/**
 * MSW Handler Module Template
 *
 * Use this template to create organized handler modules in config/test/msw/handlers/
 * Each module should focus on a specific domain (safe, transactions, balances, etc.)
 *
 * Replace all {{PLACEHOLDER}} values with actual values.
 */

import { http, HttpResponse, delay } from 'msw'

// ============================================================================
// Types
// ============================================================================

// Import or define response types
interface {{EntityName}}Response {
  // Define response structure
  id: string
  // ...
}

// ============================================================================
// Mock Data Factories
// These should be imported from config/test/msw/factories/ for consistency
// ============================================================================

// Deterministic default values (no randomness for snapshot stability)
const DEFAULT_{{ENTITY_UPPER}} = {
  id: 'mock-{{entity}}-id',
  // ...
}

// Factory function for customizable mock data
export function create{{EntityName}}(overrides: Partial<{{EntityName}}Response> = {}): {{EntityName}}Response {
  return {
    ...DEFAULT_{{ENTITY_UPPER}},
    ...overrides,
  }
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Default handlers for {{domainName}} endpoints
 * These return success responses with default mock data
 */
export const {{domainName}}Handlers = [
  // GET single item
  http.get('*/v1/chains/:chainId/{{endpoint}}/:id', ({ params }) => {
    const { chainId, id } = params
    return HttpResponse.json(create{{EntityName}}({ id: id as string }))
  }),

  // GET list
  http.get('*/v1/chains/:chainId/{{endpoint}}', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)

    return HttpResponse.json({
      count: 100,
      next: null,
      previous: null,
      results: Array.from({ length: Math.min(limit, 10) }, (_, i) =>
        create{{EntityName}}({ id: `mock-{{entity}}-${i}` })
      ),
    })
  }),

  // POST create
  http.post('*/v1/chains/:chainId/{{endpoint}}', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(create{{EntityName}}(body as Partial<{{EntityName}}Response>), {
      status: 201,
    })
  }),

  // PUT update
  http.put('*/v1/chains/:chainId/{{endpoint}}/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    return HttpResponse.json(create{{EntityName}}({ id: id as string, ...(body as object) }))
  }),

  // DELETE
  http.delete('*/v1/chains/:chainId/{{endpoint}}/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

// ============================================================================
// Scenario Handlers
// Use these for specific story states (loading, error, empty)
// ============================================================================

/**
 * Loading state handlers - simulate slow responses
 */
export const {{domainName}}LoadingHandlers = [
  http.get('*/v1/chains/:chainId/{{endpoint}}/*', async () => {
    await delay('infinite') // Never resolves - triggers loading state
    return HttpResponse.json({})
  }),
]

/**
 * Error state handlers - return error responses
 */
export const {{domainName}}ErrorHandlers = [
  http.get('*/v1/chains/:chainId/{{endpoint}}/*', () => {
    return HttpResponse.json(
      {
        message: 'Internal server error',
        code: 500,
      },
      { status: 500 }
    )
  }),

  http.post('*/v1/chains/:chainId/{{endpoint}}', () => {
    return HttpResponse.json(
      {
        message: 'Validation failed',
        code: 400,
        details: {
          field: 'Required field missing',
        },
      },
      { status: 400 }
    )
  }),
]

/**
 * Empty state handlers - return empty results
 */
export const {{domainName}}EmptyHandlers = [
  http.get('*/v1/chains/:chainId/{{endpoint}}', () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),
]

/**
 * Not found handlers - 404 responses
 */
export const {{domainName}}NotFoundHandlers = [
  http.get('*/v1/chains/:chainId/{{endpoint}}/:id', () => {
    return HttpResponse.json(
      {
        message: 'Resource not found',
        code: 404,
      },
      { status: 404 }
    )
  }),
]

// ============================================================================
// Helper for combining handlers in stories
// ============================================================================

/**
 * Create a set of handlers for a specific scenario
 *
 * Usage in stories:
 * parameters: {
 *   msw: {
 *     handlers: create{{EntityName}}Scenario('error')
 *   }
 * }
 */
export function create{{EntityName}}Scenario(
  scenario: 'success' | 'loading' | 'error' | 'empty' | 'notFound' = 'success'
) {
  switch (scenario) {
    case 'loading':
      return {{domainName}}LoadingHandlers
    case 'error':
      return {{domainName}}ErrorHandlers
    case 'empty':
      return {{domainName}}EmptyHandlers
    case 'notFound':
      return {{domainName}}NotFoundHandlers
    case 'success':
    default:
      return {{domainName}}Handlers
  }
}
