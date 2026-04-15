import { type Page, type Response, type Request, expect } from '@playwright/test'

/**
 * API assertion helpers for backend-through-UI validation.
 *
 * These helpers let you assert API responses during UI interactions,
 * effectively getting backend regression testing for free inside e2e tests.
 *
 * Usage:
 *   const response = await waitForApiResponse(page, '/balances')
 *   const data = await response.json()
 *   expect(data.items).toBeDefined()
 */

/**
 * Wait for an API response matching a URL pattern during a UI action.
 *
 * @param page - Playwright Page
 * @param urlPattern - Substring or regex to match in the response URL
 * @param options - Optional: expected status code, timeout
 * @returns The matched Response object for further assertions
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { status?: number; timeout?: number },
): Promise<Response> {
  const { status = 200, timeout = 15_000 } = options || {}

  const response = await page.waitForResponse(
    (resp) => {
      const urlMatch = typeof urlPattern === 'string' ? resp.url().includes(urlPattern) : urlPattern.test(resp.url())
      return urlMatch && resp.status() === status
    },
    { timeout },
  )

  return response
}

/**
 * Wait for an API request matching a URL pattern (for asserting payloads).
 *
 * @param page - Playwright Page
 * @param urlPattern - Substring or regex to match in the request URL
 * @param method - HTTP method to match (default: any)
 */
export async function waitForApiRequest(page: Page, urlPattern: string | RegExp, method?: string): Promise<Request> {
  const request = await page.waitForRequest(
    (req) => {
      const urlMatch = typeof urlPattern === 'string' ? req.url().includes(urlPattern) : urlPattern.test(req.url())
      const methodMatch = !method || req.method() === method
      return urlMatch && methodMatch
    },
    { timeout: 15_000 },
  )

  return request
}

/**
 * Collector for API errors during a test.
 *
 * Start collecting before actions, then assert no errors occurred:
 *
 *   const errors = collectApiErrors(page, 'safe-client')
 *   // ... perform UI actions ...
 *   await errors.assertNoErrors()
 */
export function collectApiErrors(page: Page, urlContains: string) {
  const errors: Array<{ url: string; status: number; body: string }> = []

  const handler = async (response: Response) => {
    if (response.url().includes(urlContains) && response.status() >= 400) {
      errors.push({
        url: response.url(),
        status: response.status(),
        body: await response.text().catch(() => '<could not read body>'),
      })
    }
  }

  page.on('response', handler)

  return {
    /** Get collected errors */
    get errors() {
      return errors
    },

    /** Assert that no API errors were collected */
    async assertNoErrors() {
      expect(errors, `Expected no API errors but found ${errors.length}`).toEqual([])
    },

    /** Stop collecting (call in afterEach if needed) */
    stop() {
      page.off('response', handler)
    },
  }
}

/**
 * Assert the JSON body of an API response matches expected shape.
 *
 * @param response - Playwright Response object
 * @param assertions - Function that receives the parsed JSON body
 */
export async function assertResponseBody<T = unknown>(
  response: Response,
  assertions: (body: T) => void | Promise<void>,
): Promise<void> {
  const body = (await response.json()) as T
  await assertions(body)
}
