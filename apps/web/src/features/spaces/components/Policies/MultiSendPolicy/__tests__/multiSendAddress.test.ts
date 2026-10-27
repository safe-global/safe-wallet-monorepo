import { getOfficialMultiSendCallOnlyAddresses } from '../multiSendAddress'

const V130_CANONICAL = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'
const V130_EIP155 = '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'
const V141 = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2'
const V150 = '0xA83c336B20401Af773B6219BA5027174338D1836'

describe('getOfficialMultiSendCallOnlyAddresses', () => {
  it.each(['1', '137', '11155111'])(
    'lists every official MultiSendCallOnly of v1.3.0, v1.4.1 and v1.5.0 on chain %s',
    (chainId) => {
      expect(getOfficialMultiSendCallOnlyAddresses(chainId).sort()).toEqual(
        [V130_CANONICAL, V130_EIP155, V141, V150].sort(),
      )
    },
  )

  it('lists nothing on a chain without a deployment', () => {
    expect(getOfficialMultiSendCallOnlyAddresses('987654321987')).toEqual([])
  })
})
