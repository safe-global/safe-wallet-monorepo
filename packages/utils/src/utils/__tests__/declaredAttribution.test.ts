import { buildDeclared } from '../declaredAttribution'

describe('buildDeclared', () => {
  it('should send only the channel for native channels', () => {
    expect(buildDeclared('NATIVE_TRANSFER')).toEqual({ channel: 'NATIVE_TRANSFER' })
    expect(buildDeclared('NATIVE_BATCH')).toEqual({ channel: 'NATIVE_BATCH' })
  })

  it('should send the app id of a listed Safe App', () => {
    expect(buildDeclared('SAFE_APP', { name: 'CoW Swap', url: 'https://swap.cow.fi', listedAppId: 42 })).toEqual({
      channel: 'SAFE_APP',
      appName: 'CoW Swap',
      appUrl: 'https://swap.cow.fi',
      appId: 42,
    })
  })

  it('should never send an app id for widgets or WalletConnect', () => {
    const app = { name: 'Swap', url: 'https://swap.cow.fi', listedAppId: 42 }

    expect(buildDeclared('WIDGET', app)).not.toHaveProperty('appId')
    expect(buildDeclared('WALLET_CONNECT', app)).not.toHaveProperty('appId')
  })

  it('should send only the channel when an app channel has no app', () => {
    expect(buildDeclared('WALLET_CONNECT')).toEqual({ channel: 'WALLET_CONNECT' })
  })

  it('should keep only the origin and path of the app URL', () => {
    const { appUrl } = buildDeclared('WIDGET', { url: 'https://user:pass@iframe.jumper.exchange/swap?theme=dark#top' })

    expect(appUrl).toBe('https://iframe.jumper.exchange/swap')
  })

  it('should lowercase the scheme and host of the app URL', () => {
    expect(buildDeclared('SAFE_APP', { url: 'HTTPS://Swap.Cow.Fi/' }).appUrl).toBe('https://swap.cow.fi')
  })

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://files.example', 'not a url', ''])(
    'should drop the app URL %p',
    (url) => {
      expect(buildDeclared('SAFE_APP', { name: 'App', url })).toEqual({ channel: 'SAFE_APP', appName: 'App' })
    },
  )

  it('should drop an empty app name', () => {
    expect(buildDeclared('WALLET_CONNECT', { name: '', url: 'https://app.uniswap.org' })).toEqual({
      channel: 'WALLET_CONNECT',
      appUrl: 'https://app.uniswap.org',
    })
  })
})
