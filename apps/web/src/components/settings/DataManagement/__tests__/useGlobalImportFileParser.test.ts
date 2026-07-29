import { renderHook } from '@/tests/test-utils'
import { ImportErrors, useGlobalImportJsonParser, _filterValidAbEntries } from '../useGlobalImportFileParser'

describe('filterValidAbEntries', () => {
  it('it should return undefined if no address book is provided', () => {
    const ab = _filterValidAbEntries()

    expect(ab).toBeUndefined()
  })

  it('it should return valid address books as is', () => {
    const ab = _filterValidAbEntries({ 1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name' } })

    expect(ab).toStrictEqual({ 1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name' } })
  })

  it('it should filter entries with invalid addresses', () => {
    const ab = _filterValidAbEntries({
      1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name', invalidAddress: 'name2' },
      2: { '0XAECDFD3A19F777F0C03E6BF99AAFB59937D6467B': 'name3' },
    })

    expect(ab).toStrictEqual({ 1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name' } })
  })

  it('it should filter entries with invalid names', () => {
    const ab = _filterValidAbEntries({
      1: {
        '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': '',
        '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2': ' ',
        '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5': 'name',
      },
    })

    expect(ab).toStrictEqual({ 1: { '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5': 'name' } })
  })

  it('it should remove empty chain address books pre-/post-validation', () => {
    // Pre-validation
    const ab1 = _filterValidAbEntries({ 1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name' }, 2: {} })

    expect(ab1).toStrictEqual({ 1: { '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b': 'name' } })

    // Post-validation
    const ab2 = _filterValidAbEntries({ 1: { invalidAddress: 'name' }, 2: {} })

    expect(ab2).toStrictEqual({})
  })
})

describe('useGlobalImportFileParser', () => {
  it('should return undefined values for undefined json', () => {
    const { result } = renderHook(() => useGlobalImportJsonParser(undefined))
    expect(result.current).toEqual({
      addedSafes: undefined,
      addressBook: undefined,
      addressBookEntriesCount: 0,
      addedSafesCount: 0,
      settings: undefined,
      safeApps: undefined,
      session: undefined,
      error: undefined,
    })
  })

  it('should return undefined values and error for empty json', () => {
    const { result } = renderHook(() => useGlobalImportJsonParser(JSON.stringify({ version: '1.0', data: {} })))
    expect(result.current).toEqual({
      addedSafes: undefined,
      addressBook: undefined,
      addressBookEntriesCount: 0,
      addedSafesCount: 0,
      error: ImportErrors.NO_IMPORT_DATA_FOUND,
      settings: undefined,
      safeApps: undefined,
      session: undefined,
    })
  })

  it('should return empty objects for invalid json', () => {
    const { result } = renderHook(() => useGlobalImportJsonParser('{ invalid: json'))
    expect(result.current).toEqual({
      addedSafes: undefined,
      addressBook: undefined,
      addressBookEntriesCount: 0,
      addedSafesCount: 0,
      error: ImportErrors.INVALID_JSON_FORMAT,
      settings: undefined,
      safeApps: undefined,
      session: undefined,
    })
  })

  it('should return empty objects for wrong versions', () => {
    const goerliSafeAddress = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
    const mainnetSafeAddress = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'

    const owner1 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
    const owner2 = '0x954cD69f0E902439f99156e3eeDA080752c08401'

    const jsonData = JSON.stringify({
      version: '17.0',
      data: {
        '_immortal|v2_5__SAFES': `{"${goerliSafeAddress}":{"address":"${goerliSafeAddress}","chainId":"5","threshold":2,"ethBalance":"0.3","totalFiatBalance":"435.08","owners":["${owner1}","${owner2}"],"modules":[],"spendingLimits":[],"balances":[{"tokenAddress":"0x0000000000000000000000000000000000000000","fiatBalance":"435.08100","tokenBalance":"0.3"},{"tokenAddress":"0x61fD3b6d656F39395e32f46E2050953376c3f5Ff","fiatBalance":"0.00000","tokenBalance":"22405.086233211233211233"}],"implementation":{"value":"0x3E5c63644E683549055b9Be8653de26E0B4CD36E"},"loaded":true,"nonce":1,"currentVersion":"1.3.0+L2","needsUpdate":false,"featuresEnabled":["CONTRACT_INTERACTION","DOMAIN_LOOKUP","EIP1559","ERC721","SAFE_APPS","SAFE_TX_GAS_OPTIONAL","SPENDING_LIMIT","TX_SIMULATION","WARNING_BANNER"],"loadedViaUrl":false,"guard":"","collectiblesTag":"1667921524","txQueuedTag":"1667921524","txHistoryTag":"1667400927"}}`,
        '_immortal|v2_MAINNET__SAFES': `{"${mainnetSafeAddress}":{"address":"${mainnetSafeAddress}","chainId":"1","threshold":1,"ethBalance":"0","totalFiatBalance":"0.00","owners":["${owner1}","${owner2}"],"modules":[],"spendingLimits":[],"balances":[{"tokenAddress":"0x0000000000000000000000000000000000000000","fiatBalance":"0.00000","tokenBalance":"0"}],"implementation":{"value":"0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552","name":"Gnosis Safe: Singleton 1.3.0","logoUri":"https://safe-transaction-assets.safe.global/contracts/logos/0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552.png"},"loaded":true,"nonce":2,"currentVersion":"1.3.0","needsUpdate":false,"featuresEnabled":["CONTRACT_INTERACTION","DOMAIN_LOOKUP","EIP1559","ERC721","SAFE_APPS","SAFE_TX_GAS_OPTIONAL","SPENDING_LIMIT","TX_SIMULATION"],"loadedViaUrl":false,"guard":"","collectiblesTag":"1667397095","txQueuedTag":"1667397095","txHistoryTag":"1664287235"}}`,
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    expect(result.current).toEqual({
      addedSafes: undefined,
      addressBook: undefined,
      addressBookEntriesCount: 0,
      addedSafesCount: 0,
      error: ImportErrors.INVALID_VERSION,
      settings: undefined,
      safeApps: undefined,
      session: undefined,
    })
  })

  // 1.0

  it('should parse v1 added safes correctly', () => {
    const goerliSafeAddress = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
    const mainnetSafeAddress = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'

    const owner1 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
    const owner2 = '0x954cD69f0E902439f99156e3eeDA080752c08401'

    const jsonData = JSON.stringify({
      version: '1.0',
      data: {
        '_immortal|v2_5__SAFES': `{"${goerliSafeAddress}":{"address":"${goerliSafeAddress}","chainId":"5","threshold":2,"ethBalance":"0.3","totalFiatBalance":"435.08","owners":["${owner1}","${owner2}"],"modules":[],"spendingLimits":[],"balances":[{"tokenAddress":"0x0000000000000000000000000000000000000000","fiatBalance":"435.08100","tokenBalance":"0.3"},{"tokenAddress":"0x61fD3b6d656F39395e32f46E2050953376c3f5Ff","fiatBalance":"0.00000","tokenBalance":"22405.086233211233211233"}],"implementation":{"value":"0x3E5c63644E683549055b9Be8653de26E0B4CD36E"},"loaded":true,"nonce":1,"currentVersion":"1.3.0+L2","needsUpdate":false,"featuresEnabled":["CONTRACT_INTERACTION","DOMAIN_LOOKUP","EIP1559","ERC721","SAFE_APPS","SAFE_TX_GAS_OPTIONAL","SPENDING_LIMIT","TX_SIMULATION","WARNING_BANNER"],"loadedViaUrl":false,"guard":"","collectiblesTag":"1667921524","txQueuedTag":"1667921524","txHistoryTag":"1667400927"}}`,
        '_immortal|v2_MAINNET__SAFES': `{"${mainnetSafeAddress}":{"address":"${mainnetSafeAddress}","chainId":"1","threshold":1,"ethBalance":"0","totalFiatBalance":"0.00","owners":["${owner1}","${owner2}"],"modules":[],"spendingLimits":[],"balances":[{"tokenAddress":"0x0000000000000000000000000000000000000000","fiatBalance":"0.00000","tokenBalance":"0"}],"implementation":{"value":"0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552","name":"Gnosis Safe: Singleton 1.3.0","logoUri":"https://safe-transaction-assets.safe.global/contracts/logos/0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552.png"},"loaded":true,"nonce":2,"currentVersion":"1.3.0","needsUpdate":false,"featuresEnabled":["CONTRACT_INTERACTION","DOMAIN_LOOKUP","EIP1559","ERC721","SAFE_APPS","SAFE_TX_GAS_OPTIONAL","SPENDING_LIMIT","TX_SIMULATION"],"loadedViaUrl":false,"guard":"","collectiblesTag":"1667397095","txQueuedTag":"1667397095","txHistoryTag":"1664287235"}}`,
      },
    })
    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { addedSafes, addedSafesCount, addressBook, addressBookEntriesCount, safeApps, settings } = result.current

    // No addressbook data
    expect(addressBookEntriesCount).toEqual(0)
    expect(addressBook).toEqual(undefined)

    expect(addedSafesCount).toEqual(2)
    expect(addedSafes).toBeDefined()
    if (!addedSafes) {
      fail('No added safes found')
    }
    expect(addedSafes['5'][goerliSafeAddress]).toBeDefined()
    const goerliAddedSafe = addedSafes['5'][goerliSafeAddress]
    expect(goerliAddedSafe.threshold).toEqual(2)

    expect(addedSafes['1'][mainnetSafeAddress]).toBeDefined()
    const mainnetAddedSafe = addedSafes['1'][mainnetSafeAddress]
    expect(mainnetAddedSafe.threshold).toEqual(1)

    // Only v2
    expect(safeApps).toEqual(undefined)
    expect(settings).toEqual(undefined)
  })

  it('should parse v1 address book entries correctly', () => {
    const goerliAddress1 = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
    const goerliName1 = 'test.eth'
    const goerliAddress2 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
    const goerliName2 = 'some.eth'
    const mainnetAddress1 = '0x954cD69f0E902439f99156e3eeDA080752c08401'
    const mainnetName1 = 'mobile owner'
    const mainnetAddress2 = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'
    const mainnetName2 = 'S0mE&W3!rd#N4m€'

    const jsonData = JSON.stringify({
      version: '1.0',
      data: {
        SAFE__addressBook: `[{"address":"${mainnetAddress1}","name":"${mainnetName1}","chainId":"1"},
      {"address":"${mainnetAddress2}","name":"${mainnetName2}","chainId":"1"},
      {"address":"${goerliAddress1}","name":"${goerliName1}","chainId":"5"},
      {"address":"${goerliAddress2}","name":"${goerliName2}","chainId":"5"}]`,
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { addedSafes, addedSafesCount, addressBook, addressBookEntriesCount, safeApps, settings } = result.current

    // no added safes
    // No addressbook data
    expect(addedSafesCount).toEqual(0)
    expect(addedSafes).toEqual(undefined)

    expect(addressBookEntriesCount).toEqual(4)
    if (!addressBook) {
      fail('No addressbook migrated')
    }
    expect(addressBook['5'][goerliAddress1]).toEqual(goerliName1)
    expect(addressBook['5'][goerliAddress2]).toEqual(goerliName2)

    expect(addressBook['1'][mainnetAddress1]).toEqual(mainnetName1)
    expect(addressBook['1'][mainnetAddress2]).toEqual(mainnetName2)

    // Only v2
    expect(safeApps).toEqual(undefined)
    expect(settings).toEqual(undefined)
  })

  // 2.0

  it('should parse v2 added Safes correctly', () => {
    const goerliSafeAddress = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
    const mainnetSafeAddress = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'

    const owner1 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
    const owner2 = '0x954cD69f0E902439f99156e3eeDA080752c08401'

    const jsonData = JSON.stringify({
      version: '2.0',
      data: {
        addedSafes: {
          '5': {
            [goerliSafeAddress]: {
              owners: [{ value: owner1 }, { value: owner2 }],
              threshold: 2,
              ethBalance: '0',
            },
          },
          '1': {
            [mainnetSafeAddress]: {
              owners: [{ value: owner1 }, { value: owner2 }],
              threshold: 1,
              ethBalance: '0',
            },
          },
        },
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { addedSafes, addedSafesCount } = result.current

    expect(addedSafesCount).toEqual(2)

    expect(addedSafes).toBeDefined()
    if (!addedSafes) {
      fail('No added Safes found')
    }

    expect(addedSafes['5'][goerliSafeAddress]).toBeDefined()

    const goerliAddedSafe = addedSafes['5'][goerliSafeAddress]
    expect(goerliAddedSafe.threshold).toEqual(2)

    expect(addedSafes['1'][mainnetSafeAddress]).toBeDefined()
    const mainnetAddedSafe = addedSafes['1'][mainnetSafeAddress]
    expect(mainnetAddedSafe.threshold).toEqual(1)
  })

  it('should parse v2 address book entries correctly', () => {
    const goerliAddress1 = '0xAecDFD3A19f777F0c03e6bf99AAfB59937d6467b'
    const goerliName1 = 'test.eth'
    const goerliAddress2 = '0x3819b800c67Be64029C1393c8b2e0d0d627dADE2'
    const goerliName2 = 'some.eth'
    const mainnetAddress1 = '0x954cD69f0E902439f99156e3eeDA080752c08401'
    const mainnetName1 = 'mobile owner'
    const mainnetAddress2 = '0x7cB6E6Cbc845e79d9CA05F6577141DA36ad398f5'
    const mainnetName2 = 'S0mE&W3!rd#N4m€'

    const jsonData = JSON.stringify({
      version: '2.0',
      data: {
        addressBook: {
          '5': {
            [goerliAddress1]: goerliName1,
            [goerliAddress2]: goerliName2,
          },
          '1': {
            [mainnetAddress1]: mainnetName1,
            [mainnetAddress2]: mainnetName2,
          },
        },
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { addressBook, addressBookEntriesCount } = result.current

    expect(addressBookEntriesCount).toEqual(4)

    if (!addressBook) {
      fail('No address book found')
    }

    expect(addressBook['5'][goerliAddress1]).toEqual(goerliName1)
    expect(addressBook['5'][goerliAddress2]).toEqual(goerliName2)

    expect(addressBook['1'][mainnetAddress1]).toEqual(mainnetName1)
    expect(addressBook['1'][mainnetAddress2]).toEqual(mainnetName2)
  })

  it('should parse v2 settings correctly', () => {
    const jsonData = JSON.stringify({
      version: '2.0',
      data: {
        settings: {
          currency: 'usd',
          shortName: { show: true, copy: true, qr: true },
          theme: { darkMode: false },
        },
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { settings } = result.current

    if (!settings) {
      fail('No settings found')
    }

    expect(settings.currency).toEqual('usd')

    expect(settings.shortName.qr).toEqual(true)

    expect(settings.theme.darkMode).toEqual(false)
  })

  it('should parse v2 Safe app settings correctly', () => {
    const jsonData = JSON.stringify({
      version: '2.0',
      data: {
        safeApps: {
          '5': {
            pinned: [1, 2, 3],
          },
          '1': {
            pinned: [4, 5, 6],
          },
        },
      },
    })

    const { result } = renderHook(() => useGlobalImportJsonParser(jsonData))

    const { safeApps } = result.current

    if (!safeApps) {
      fail('No Safe app settings found')
    }

    expect(safeApps['5'].pinned).toEqual([1, 2, 3])
    expect(safeApps['1'].pinned).toEqual([4, 5, 6])
  })
})
