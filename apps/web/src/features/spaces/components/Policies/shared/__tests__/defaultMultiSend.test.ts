import { getDefaultMultiSend } from '../defaultMultiSend'

const MULTI_SEND_POLICY = '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c'

describe('getDefaultMultiSend', () => {
  it('binds the official MultiSendCallOnly deployments to MultiSendPolicy', () => {
    const defaults = getDefaultMultiSend('11155111')

    expect(defaults?.policy).toBe(MULTI_SEND_POLICY)
    expect(defaults?.targets).toHaveLength(4)
  })

  it('returns nothing on a chain without a policy engine', () => {
    expect(getDefaultMultiSend('10')).toBeUndefined()
  })
})
