import { render } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import App from '../App'
import { fakeSdk } from './sdk'

export const renderApp = (items: TokenBalance[]): UserEvent => {
  fakeSdk.safe.experimental_getBalances.mockResolvedValue({ fiatTotal: '0', items })
  const user = userEvent.setup()
  render(<App />)
  return user
}
