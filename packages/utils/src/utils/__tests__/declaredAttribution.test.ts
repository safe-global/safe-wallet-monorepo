import { buildDeclared } from '../declaredAttribution'

describe('buildDeclared', () => {
  it('should send only the channel for native channels', () => {
    expect(buildDeclared('native-transfer')).toEqual({ channel: 'native-transfer' })
    expect(buildDeclared('native-batch')).toEqual({ channel: 'native-batch' })
  })

  it('should send the app id of a listed Safe App', () => {
    expect(buildDeclared('safe-app', { name: 'CoW Swap', url: 'https://swap.cow.fi', listedAppId: 42 })).toEqual({
      channel: 'safe-app',
      appName: 'CoW Swap',
      appUrl: 'https://swap.cow.fi',
      appId: 42,
    })
  })

  it('should never send an app id for widgets or WalletConnect', () => {
    const app = { name: 'Swap', url: 'https://swap.cow.fi', listedAppId: 42 }

    expect(buildDeclared('widget', app)).not.toHaveProperty('appId')
    expect(buildDeclared('wallet-connect', app)).not.toHaveProperty('appId')
  })

  it('should send only the channel when an app channel has no app', () => {
    expect(buildDeclared('wallet-connect')).toEqual({ channel: 'wallet-connect' })
  })

  it('should keep only the origin and path of the app URL', () => {
    const { appUrl } = buildDeclared('widget', { url: 'https://user:pass@iframe.jumper.exchange/swap?theme=dark#top' })

    expect(appUrl).toBe('https://iframe.jumper.exchange/swap')
  })

  it('should lowercase the scheme and host of the app URL', () => {
    expect(buildDeclared('safe-app', { url: 'HTTPS://Swap.Cow.Fi/' }).appUrl).toBe('https://swap.cow.fi')
  })

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://files.example', 'not a url', ''])(
    'should drop the app URL %p',
    (url) => {
      expect(buildDeclared('safe-app', { name: 'App', url })).toEqual({ channel: 'safe-app', appName: 'App' })
    },
  )

  it('should drop an empty app name', () => {
    expect(buildDeclared('wallet-connect', { name: '', url: 'https://app.uniswap.org' })).toEqual({
      channel: 'wallet-connect',
      appUrl: 'https://app.uniswap.org',
    })
  })
})
