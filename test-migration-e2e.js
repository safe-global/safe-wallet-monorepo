/**
 * Simple test script to verify the migration flow works end-to-end
 * Tests the opBNB Safe: 0x69158987610093f2A3156987E412fC0Bf40C6F64
 */

const { ethers } = require('ethers')
const Safe = require('@safe-global/protocol-kit').default
const { getSafeL2SingletonDeployment } = require('@safe-global/safe-deployments')

const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org'
const SAFE_ADDRESS = '0x69158987610093f2A3156987E412fC0Bf40C6F64'
const CHAIN_ID = '204'
const IMPLEMENTATION = '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'

async function testMigrationFlow() {
  console.log('=== Testing Migration Flow ===\n')

  // Step 1: Create provider
  console.log('Step 1: Creating provider...')
  const provider = new ethers.JsonRpcProvider(OPBNB_RPC)
  const network = await provider.getNetwork()
  console.log('✓ Connected to network:', network.chainId.toString())

  // Step 2: Fetch Safe version from contract
  console.log('\nStep 2: Fetching Safe version from contract...')
  const safeContract = new ethers.Contract(
    SAFE_ADDRESS,
    ['function VERSION() view returns (string)'],
    provider
  )
  const version = await safeContract.VERSION()
  console.log('✓ Safe version:', version)

  // Step 3: Fetch implementation bytecode
  console.log('\nStep 3: Fetching implementation bytecode...')
  const bytecode = await provider.getCode(IMPLEMENTATION)
  console.log('✓ Bytecode length:', bytecode.length)

  // Step 4: Compare bytecode hash
  console.log('\nStep 4: Comparing bytecode hash...')
  const bytecodeHash = ethers.keccak256(bytecode)
  console.log('Bytecode hash:', bytecodeHash)

  const deployment = getSafeL2SingletonDeployment({ version: '1.3.0' })
  const expectedHash = deployment.deployments.eip155.codeHash
  console.log('Expected hash:', expectedHash)

  const matches = bytecodeHash === expectedHash
  console.log(matches ? '✓ Bytecode matches!' : '✗ Bytecode does NOT match')

  if (!matches) {
    console.error('\n❌ Test failed: Bytecode comparison failed')
    process.exit(1)
  }

  // Step 5: Initialize SDK with custom contract networks
  console.log('\nStep 5: Initializing Safe SDK with custom contract networks...')
  let sdk
  try {
    sdk = await Safe.init({
      provider: OPBNB_RPC,
      safeAddress: SAFE_ADDRESS,
      isL1SafeSingleton: false,
      contractNetworks: {
        [CHAIN_ID]: {
          safeSingletonAddress: IMPLEMENTATION,
        },
      },
    })
    console.log('✓ SDK initialized successfully')
  } catch (error) {
    console.error('✗ SDK initialization failed:', error.message)
    console.error('\n❌ Test failed: SDK initialization failed')
    process.exit(1)
  }

  // Step 6: Verify SDK can read Safe data
  console.log('\nStep 6: Verifying SDK can read Safe data...')
  try {
    const address = await sdk.getAddress()
    console.log('✓ Safe address:', address)

    const sdkVersion = await sdk.getContractVersion()
    console.log('✓ Safe version from SDK:', sdkVersion)

    const owners = await sdk.getOwners()
    console.log('✓ Safe owners:', owners.length)

    const threshold = await sdk.getThreshold()
    console.log('✓ Safe threshold:', threshold)

    const nonce = await sdk.getNonce()
    console.log('✓ Safe nonce:', nonce)
  } catch (error) {
    console.error('✗ Failed to read Safe data:', error.message)
    console.error('\n❌ Test failed: SDK cannot read Safe data')
    process.exit(1)
  }

  // Step 7: Create migration transaction
  console.log('\nStep 7: Creating migration transaction...')
  try {
    // Get the migration contract address
    const { getSafeMigrationDeployment } = require('@safe-global/safe-deployments')
    const migrationDeployment = getSafeMigrationDeployment({
      network: CHAIN_ID,
      version: '1.4.1'
    })

    if (!migrationDeployment || !migrationDeployment.networkAddresses[CHAIN_ID]) {
      console.error('✗ Migration contract not available on this network')
      console.error('\n❌ Test failed: Migration contract not deployed')
      process.exit(1)
    }

    const migrationAddress = migrationDeployment.networkAddresses[CHAIN_ID]
    console.log('Migration contract address:', migrationAddress)

    // Get the target L2 singleton address (canonical deployment)
    const targetDeployment = getSafeL2SingletonDeployment({ version: '1.3.0' })
    const targetAddress = targetDeployment.deployments.canonical.address
    console.log('Target L2 singleton address:', targetAddress)

    if (!targetAddress || targetAddress === '0x0000000000000000000000000000000000000000') {
      console.error('✗ Invalid target address')
      console.error('\n❌ Test failed: Invalid target singleton address')
      process.exit(1)
    }

    // Encode the migration call
    const migrationInterface = new ethers.Interface([
      'function migrateToL2(address l2Singleton)',
    ])
    const data = migrationInterface.encodeFunctionData('migrateToL2', [targetAddress])

    // Create the transaction
    const txData = {
      to: migrationAddress,
      value: '0',
      data,
    }

    const safeTx = await sdk.createTransaction({ transactions: [txData] })
    console.log('✓ Migration transaction created')
    console.log('Transaction details:', {
      to: safeTx.data.to,
      value: safeTx.data.value,
      dataLength: safeTx.data.data.length,
      nonce: safeTx.data.nonce,
    })
  } catch (error) {
    console.error('✗ Failed to create migration transaction:', error.message)
    console.error(error)
    console.error('\n❌ Test failed: Cannot create migration transaction')
    process.exit(1)
  }

  console.log('\n=== ✅ All tests passed! ===')
  console.log('The migration flow should work in the UI.')
}

testMigrationFlow().catch((error) => {
  console.error('\n❌ Test failed with error:', error)
  process.exit(1)
})
