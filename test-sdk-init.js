const { ethers } = require('ethers')
const Safe = require('@safe-global/protocol-kit').default

async function testSDKInit() {
  const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org'
  const SAFE_ADDRESS = '0x69158987610093f2A3156987E412fC0Bf40C6F64'
  const CHAIN_ID = '204'
  const IMPLEMENTATION = '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'

  console.log('Creating provider...')
  const provider = new ethers.JsonRpcProvider(OPBNB_RPC)

  console.log('Fetching Safe version...')
  const safeContract = new ethers.Contract(
    SAFE_ADDRESS,
    ['function VERSION() view returns (string)'],
    provider
  )
  const version = await safeContract.VERSION()
  console.log('Version:', version)

  console.log('Fetching implementation bytecode...')
  const bytecode = await provider.getCode(IMPLEMENTATION)
  console.log('Bytecode length:', bytecode.length)

  console.log('Computing bytecode hash...')
  const bytecodeHash = ethers.keccak256(bytecode)
  console.log('Bytecode hash:', bytecodeHash)

  // Check against known L2 deployment hashes
  const { getSafeL2SingletonDeployments } = require('@safe-global/safe-deployments')

  console.log('\nChecking against 1.3.0 L2 deployments...')
  const deployment130 = getSafeL2SingletonDeployments({ version: '1.3.0' })
  console.log('1.3.0 deployment:', JSON.stringify(deployment130, null, 2))

  console.log('\nChecking against 1.4.1 L2 deployments...')
  const deployment141 = getSafeL2SingletonDeployments({ version: '1.4.1' })
  console.log('1.4.1 deployment:', JSON.stringify(deployment141, null, 2))

  // Try to initialize SDK with custom contract networks
  console.log('\n\nAttempting SDK initialization with custom contract networks...')
  try {
    const sdk = await Safe.init({
      provider: OPBNB_RPC,
      safeAddress: SAFE_ADDRESS,
      isL1SafeSingleton: false,
      contractNetworks: {
        [CHAIN_ID]: {
          safeSingletonAddress: IMPLEMENTATION,
        },
      },
    })
    console.log('✅ SDK initialized successfully!')
    console.log('Safe address from SDK:', await sdk.getAddress())
    console.log('Safe version from SDK:', await sdk.getContractVersion())
  } catch (error) {
    console.error('❌ SDK initialization failed:')
    console.error(error.message)
    console.error('\nFull error:')
    console.error(error)
  }
}

testSDKInit().catch(console.error)
