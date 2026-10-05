const keys = ['CHAIN_ID', 'CONSENSUS_ADDRESS', 'COORDINATOR_ADDRESS', 'ORACLE_ADDRESSES']
const prefixes = ['NEXT_PUBLIC_', 'EXPO_PUBLIC_']
const originalEnv = { ...process.env }

beforeEach(() => {
  jest.resetModules()
  for (const prefix of prefixes) {
    for (const key of keys) delete process.env[`${prefix}SAFENET_${key}`]
  }
})

afterEach(() => {
  process.env = { ...originalEnv }
})

// Reload the module after each environment change; static imports would retain the old deployment.
const singleton = async () => (await import('../safenetReader')).getSafenetReader()

describe('Safenet singleton deployment configuration', () => {
  it.each(prefixes)('rejects stale %s deployment settings', async (prefix) => {
    for (const [key, value] of [
      ['CHAIN_ID', '11155111'],
      ['CONSENSUS_ADDRESS', '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'],
      ['COORDINATOR_ADDRESS', '0xaE27021CEB45316f1efe69D8E362aC07ED3Bd7E4'],
      ['ORACLE_ADDRESSES', '0x00000000000000000000000000000000000000AA'],
    ]) {
      process.env[`${prefix}SAFENET_${key}`] = value
      jest.resetModules()
      await expect(singleton()).rejects.toThrow('deployment configuration does not match')
      delete process.env[`${prefix}SAFENET_${key}`]
    }
  })

  it.each(prefixes)('uses pinned defaults for blank %s address settings', async (prefix) => {
    for (const key of keys.slice(1)) process.env[`${prefix}SAFENET_${key}`] = '  '
    const { SAFENET_DEPLOYMENT, SAFENET_CONSENSUS_ADDRESS, SAFENET_COORDINATOR_ADDRESS, SAFENET_ORACLE_ADDRESSES } =
      await import('../../constants')

    expect(SAFENET_CONSENSUS_ADDRESS).toBe(SAFENET_DEPLOYMENT.consensus)
    expect(SAFENET_COORDINATOR_ADDRESS).toBe(SAFENET_DEPLOYMENT.coordinator)
    expect(SAFENET_ORACLE_ADDRESSES).toEqual(SAFENET_DEPLOYMENT.oracles)
    expect(await singleton()).toBe(await singleton())
  })
})
