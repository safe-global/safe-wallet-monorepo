import { MixpanelTracingProvider } from '../provider'
import { trackErrorSurfaced } from '../error-tracking'

jest.mock('../error-tracking', () => ({
  trackErrorSurfaced: jest.fn(),
}))

const mockedTrackErrorSurfaced = trackErrorSurfaced as jest.MockedFunction<typeof trackErrorSurfaced>

describe('MixpanelTracingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards coded errors to the Error Surfaced analytics event (taxonomy only)', () => {
    const provider = new MixpanelTracingProvider()
    const error = new Error('Code 804: revert')

    provider.captureError({ error, isUserFacing: true, code: 804, context: { txHash: '0xabc' } })

    expect(mockedTrackErrorSurfaced).toHaveBeenCalledWith({
      code: 804,
      message: 'Code 804: revert',
      isUserFacing: true,
      context: { txHash: '0xabc' },
    })
  })

  it('skips raw crashes that carry no coded taxonomy', () => {
    const provider = new MixpanelTracingProvider()

    provider.captureError({ error: new Error('render crash'), isUserFacing: true })

    expect(mockedTrackErrorSurfaced).not.toHaveBeenCalled()
  })

  it('is inert as a logging sink (Mixpanel is not a logger)', () => {
    const provider = new MixpanelTracingProvider()

    provider.init()
    const logger = provider.getLogger()
    logger.info('info')
    logger.warn('warn')
    logger.error('error')
    logger.debug('debug')

    expect(mockedTrackErrorSurfaced).not.toHaveBeenCalled()
  })
})
