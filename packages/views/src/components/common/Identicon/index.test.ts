import { blo } from 'blo'
import { getIdenticonSrc } from '@safe-global/views/components/common/Identicon'

describe('getIdenticonSrc', () => {
  it('should, when given a valid address, return the blockie data URL for that address', () => {
    const address = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'

    expect(getIdenticonSrc(address)).toBe(blo(address))
  })

  it('should, when given a string that is not an address, return undefined', () => {
    expect(getIdenticonSrc('invalid-address')).toBeUndefined()
  })
})
