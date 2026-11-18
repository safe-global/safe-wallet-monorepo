import type * as RtlPure from '@testing-library/react/pure'
import type * as UseChains from '@/hooks/useChains'
import type OidcSignInOptionsComponent from '../OidcSignInOptions'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('../../../components/GoogleSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="google-login-btn">Continue with Google</button>,
}))
jest.mock('../../../components/EmailSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="email-login-btn">Continue with email</button>,
}))

type Loaded = {
  rtl: typeof RtlPure
  OidcSignInOptions: typeof OidcSignInOptionsComponent
}

// dynamic() keeps the first loaded component, so each test loads the wrapper, React and RTL in a fresh registry.
const loadWithOidcFlag = (enabled: boolean | undefined): Loaded => {
  let loaded!: Loaded
  jest.isolateModules(() => {
    const useChains: typeof UseChains = require('@/hooks/useChains')
    jest
      .spyOn(useChains, 'useHasFeature')
      .mockImplementation((feature) => (feature === FEATURES.OIDC_AUTH ? enabled : false))
    loaded = { rtl: require('@testing-library/react/pure'), OidcSignInOptions: require('../OidcSignInOptions').default }
  })
  return loaded
}

describe('OidcSignInOptions', () => {
  let cleanup: () => void = () => undefined

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  it.each([false, undefined])('renders nothing while the OIDC flag is %s', (enabled) => {
    const { rtl, OidcSignInOptions } = loadWithOidcFlag(enabled)
    cleanup = rtl.cleanup

    const { container } = rtl.render(<OidcSignInOptions />)

    expect(container).toBeEmptyDOMElement()
  })

  it.each(['first', 'second'])(
    'shows no divider while the chunk loads, then the divider and both buttons (%s mount)',
    async () => {
      const { rtl, OidcSignInOptions } = loadWithOidcFlag(true)
      cleanup = rtl.cleanup

      rtl.render(<OidcSignInOptions />)

      expect(rtl.screen.queryByText('OR')).not.toBeInTheDocument()
      expect(await rtl.screen.findByText('OR')).toBeInTheDocument()
      expect(rtl.screen.getByTestId('google-login-btn')).toBeInTheDocument()
      expect(rtl.screen.getByTestId('email-login-btn')).toBeInTheDocument()
    },
  )
})
