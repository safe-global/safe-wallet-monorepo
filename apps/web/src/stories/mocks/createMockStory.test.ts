import { createElement } from 'react'
import { http, type HttpHandler } from 'msw'
import { render, screen } from '@testing-library/react'
import type { StoryContext } from '@storybook/react'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { chainFixtures } from '../../../../../config/test/msw/fixtures'
import { createMockStory } from './createMockStory'

const sessionExpiresAt = (config: Parameters<typeof createMockStory>[0]) =>
  (createMockStory(config).initialState as { auth: { sessionExpiresAt: number | null } }).auth.sessionExpiresAt

const servesSpacesList = (config: Parameters<typeof createMockStory>[0]) =>
  createMockStory(config).handlers.some((handler) => String((handler as HttpHandler).info.path) === '/\\/v1\\/spaces$/')

const ChainName = () => {
  const { data } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  return createElement(
    'span',
    { 'data-testid': 'chain-name' },
    data?.entities[chainFixtures.mainnet.chainId]?.chainName ?? 'no chain',
  )
}

const neverAnswers = http.get(/\/v2\/chains/, () => new Promise<never>(() => {}))

// Renders a story with the decorator and returns what the first render shows, before any request can answer
const firstRenderChainName = (
  config: Parameters<typeof createMockStory>[0],
  storyHandlers?: (handlers: HttpHandler[]) => unknown,
) => {
  const { decorator, parameters, handlers } = createMockStory(config)
  const msw = { handlers: storyHandlers ? storyHandlers(handlers as HttpHandler[]) : parameters.msw.handlers }
  const context = { globals: {}, id: 'test', parameters: { ...parameters, msw } } as unknown as StoryContext
  const Decorated = () => decorator(ChainName, context)
  render(createElement(Decorated))
  return screen.getByTestId('chain-name').textContent
}

describe('createMockStory', () => {
  it('leaves the user signed out by default', () => {
    expect(sessionExpiresAt({})).toBeNull()
  })

  it('signs the user in when authenticated is true', () => {
    expect(sessionExpiresAt({ authenticated: true })).toBeGreaterThan(Date.now())
  })

  it('serves the Workspace mocks when authenticated is true', () => {
    expect(servesSpacesList({ authenticated: true })).toBe(true)
  })

  it('does not serve the Workspace mocks when signed out', () => {
    expect(servesSpacesList({})).toBe(false)
  })

  it('has the chain config in the first render', () => {
    expect(firstRenderChainName({})).toBe(chainFixtures.mainnet.chainName)
  })

  // createHandlers appends config handlers after the defaults, so MSW never reaches this one
  it('preloads the chain config when the config handler for /v2/chains comes after the default', () => {
    expect(firstRenderChainName({ handlers: [neverAnswers] })).toBe(chainFixtures.mainnet.chainName)
  })

  it('leaves the chain config to a story that answers /v2/chains through its parameters', () => {
    expect(firstRenderChainName({}, (handlers) => [neverAnswers, ...handlers])).toBe('no chain')
  })

  it('leaves the chain config to a story with named handler groups that answer /v2/chains', () => {
    expect(firstRenderChainName({}, (handlers) => ({ chains: [neverAnswers], rest: handlers }))).toBe('no chain')
  })

  it('preloads the chain config when the story adds handlers for other requests', () => {
    const other = http.get(/\/v1\/other$/, () => new Promise<never>(() => {}))
    expect(firstRenderChainName({}, (handlers) => [other, ...handlers])).toBe(chainFixtures.mainnet.chainName)
  })

  it('does not preload when the story does not use the createMockStory handlers', () => {
    expect(firstRenderChainName({}, () => [])).toBe('no chain')
  })
})
