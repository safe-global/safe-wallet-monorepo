import userEvent from '@testing-library/user-event'
import type { NextRouter } from 'next/router'

import { AppRoutes } from '@/config/routes'
import { render, screen } from '@/tests/test-utils'
import { SafeAppCardContainer, getSafeAppUrl } from '.'

describe('getSafeAppUrl', () => {
  const router = { query: { safe: 'eth:0x123' }, pathname: AppRoutes.apps.index } as unknown as NextRouter

  it('links to the Safe App open page by default', () => {
    expect(getSafeAppUrl(router, 'https://app.uniswap.org')).toBe(
      `${AppRoutes.apps.open}?safe=eth%3A0x123&appUrl=https%3A%2F%2Fapp.uniswap.org`,
    )
  })

  it('links straight to the native route when one is provided', () => {
    expect(getSafeAppUrl(router, 'https://swap.cow.fi', AppRoutes.swap)).toBe(`${AppRoutes.swap}?safe=eth%3A0x123`)
  })
})

describe('SafeAppCardContainer', () => {
  it('keeps card actions outside the app navigation link', async () => {
    const user = userEvent.setup()
    const onCardClick = jest.fn()
    const onActionClick = jest.fn()

    const { container } = render(
      <SafeAppCardContainer safeAppUrl="/apps/open" onClickSafeApp={onCardClick}>
        <button type="button" onClick={onActionClick}>
          Pin app
        </button>
      </SafeAppCardContainer>,
    )

    await user.click(screen.getByRole('button', { name: 'Pin app' }))

    expect(onActionClick).toHaveBeenCalledTimes(1)
    expect(onCardClick).not.toHaveBeenCalled()
    expect(container.querySelector('a button')).not.toBeInTheDocument()
  })

  it('isolates its stacking context so content cannot paint over sticky page bars', () => {
    const { container } = render(
      <SafeAppCardContainer safeAppUrl="/apps/open">
        <span>App name</span>
      </SafeAppCardContainer>,
    )

    expect(container.querySelector('[data-slot="card"]')).toHaveClass('isolate')
  })
})
