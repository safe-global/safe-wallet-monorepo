import { _getRedirectUrl } from '../../legacy-pages/404'

describe('_getRedirectUrl', () => {
  it('moves a safe address from the path to the query', () => {
    const url = _getRedirectUrl({
      pathname: '/eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6/balances',
      search: '',
    } as Location)
    expect(url).toBe('/balances?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6')
  })

  it('adds home to the path in case there is no path defined', () => {
    const url = _getRedirectUrl({
      pathname: '/eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
      search: '',
    } as Location)
    expect(url).toBe('/home?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6')
  })

  it('returns undefined if the path is not a safe address', () => {
    const url = _getRedirectUrl({
      pathname: '/welcome',
      search: '',
    } as Location)
    expect(url).toBeUndefined()
  })

  it('preserves query parameters', () => {
    const url = _getRedirectUrl({
      pathname: '/eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6/transactions/history',
      search: '?foo=bar&baz=qux',
    } as Location)
    expect(url).toBe('/transactions/history?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6&foo=bar&baz=qux')
  })

  it('rewrites tx id from path to query', () => {
    const url = _getRedirectUrl({
      pathname:
        '/eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6/transactions/multisig_0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6_0x102f72ce18d977a144ddef78c1f35a3102d04e94cc39e3e59d874874f22a7ec2',
      search: '',
    } as Location)
    expect(url).toBe(
      '/transactions/tx?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6&id=multisig_0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6_0x102f72ce18d977a144ddef78c1f35a3102d04e94cc39e3e59d874874f22a7ec2',
    )
  })

  it('does not rewrite other transaction routes', () => {
    const url = _getRedirectUrl({
      pathname: '/eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6/transactions/messages',
      search: '',
    } as Location)
    expect(url).toBe('/transactions/messages?safe=eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6')
  })
})
