import { fireEvent, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import { AppRoutes } from '@/config/routes'
import EnvHintButton from '..'

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

const renderButton = (
  options: {
    chainId?: string
    rpc?: Record<string, string>
    tenderly?: { url: string; accessToken: string }
    routerPush?: jest.Mock
    routerQuery?: Record<string, string>
  } = {},
) => {
  const push = options.routerPush ?? jest.fn()
  const result = render(<EnvHintButton chainId={options.chainId} />, {
    routerProps: {
      push,
      query: options.routerQuery ?? {},
    },
    initialReduxState: {
      settings: {
        ...settingsInitialState,
        env: {
          rpc: options.rpc ?? {},
          tenderly: options.tenderly ?? settingsInitialState.env.tenderly,
        },
      },
    },
  })
  return { ...result, push }
}

describe('EnvHintButton', () => {
  it('renders nothing when env is in its initial state', () => {
    renderButton()
    expect(screen.queryByRole('button', { name: 'Default environment has been changed' })).not.toBeInTheDocument()
  })

  it('renders the warning trigger when an RPC override exists for the current chain', () => {
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' } })
    expect(screen.getByRole('button', { name: 'Default environment has been changed' })).toBeInTheDocument()
  })

  it('renders the warning trigger when Tenderly settings are overridden', () => {
    renderButton({
      tenderly: { url: 'https://tenderly.example.com', accessToken: 'abc' },
    })
    expect(screen.getByRole('button', { name: 'Default environment has been changed' })).toBeInTheDocument()
  })

  it('renders nothing when the override is for a different chain than the one passed via prop', () => {
    renderButton({ chainId: '5', rpc: { '1': 'https://my-rpc.example.com' } })
    expect(screen.queryByRole('button', { name: 'Default environment has been changed' })).not.toBeInTheDocument()
  })

  it('renders the warning when the override matches the chainId prop', () => {
    renderButton({ chainId: '5', rpc: { '5': 'https://my-rpc.example.com' } })
    expect(screen.getByRole('button', { name: 'Default environment has been changed' })).toBeInTheDocument()
  })

  it('navigates to the environment variables settings page on click', () => {
    const push = jest.fn()
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' }, routerPush: push })

    fireEvent.click(screen.getByRole('button', { name: 'Default environment has been changed' }))

    expect(push).toHaveBeenCalledWith({
      pathname: AppRoutes.settings.environmentVariables,
      query: {},
    })
  })

  it('preserves the current router query (e.g. safe) when navigating', () => {
    const push = jest.fn()
    const query = { safe: 'eth:0x1234567890123456789012345678901234567890' }
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' }, routerPush: push, routerQuery: query })

    fireEvent.click(screen.getByRole('button', { name: 'Default environment has been changed' }))

    expect(push).toHaveBeenCalledWith({
      pathname: AppRoutes.settings.environmentVariables,
      query,
    })
  })

  it('navigates on Enter key', () => {
    const push = jest.fn()
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' }, routerPush: push })

    fireEvent.keyDown(screen.getByRole('button', { name: 'Default environment has been changed' }), { key: 'Enter' })

    expect(push).toHaveBeenCalledTimes(1)
  })

  it('navigates on Space key', () => {
    const push = jest.fn()
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' }, routerPush: push })

    fireEvent.keyDown(screen.getByRole('button', { name: 'Default environment has been changed' }), { key: ' ' })

    expect(push).toHaveBeenCalledTimes(1)
  })

  it('does not navigate on other keys', () => {
    const push = jest.fn()
    renderButton({ rpc: { '1': 'https://my-rpc.example.com' }, routerPush: push })

    fireEvent.keyDown(screen.getByRole('button', { name: 'Default environment has been changed' }), { key: 'a' })

    expect(push).not.toHaveBeenCalled()
  })

  it('stops click propagation so the surrounding dropdown trigger does not open', () => {
    const push = jest.fn()
    const parentClick = jest.fn()
    render(
      <div onClick={parentClick} data-testid="parent">
        <EnvHintButton chainId="1" />
      </div>,
      {
        routerProps: { push, query: {} },
        initialReduxState: {
          settings: {
            ...settingsInitialState,
            env: { rpc: { '1': 'https://my-rpc.example.com' }, tenderly: settingsInitialState.env.tenderly },
          },
        },
      },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Default environment has been changed' }))

    expect(push).toHaveBeenCalledTimes(1)
    expect(parentClick).not.toHaveBeenCalled()
  })
})
