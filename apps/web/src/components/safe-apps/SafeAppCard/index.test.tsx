import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'

import { render, screen } from '@/tests/test-utils'
import { getSafeAppUrl, SafeAppCardContainer } from '.'

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

describe('getSafeAppUrl', () => {
  const SAFE = 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
  const APP_URL = 'https://apps-portal.safe.global/tx-builder'

  it('links to the app opened in the Safe of the link query', () => {
    const url = getSafeAppUrl({ safe: SAFE }, APP_URL)

    expect(url).toBe(
      '/apps/open?safe=eth%3A0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6&appUrl=https%3A%2F%2Fapps-portal.safe.global%2Ftx-builder',
    )
  })

  it('keeps the Workspace id of the link query as the last param', () => {
    const spaceId = faker.string.uuid()

    const url = getSafeAppUrl({ safe: SAFE, spaceId }, APP_URL)

    expect(url).toBe(
      `/apps/open?safe=eth%3A0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6&appUrl=https%3A%2F%2Fapps-portal.safe.global%2Ftx-builder&spaceId=${spaceId}`,
    )
  })
})
