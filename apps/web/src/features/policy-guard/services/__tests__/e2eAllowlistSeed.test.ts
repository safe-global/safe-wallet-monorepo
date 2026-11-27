import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import {
  configurationRootOf,
  firstSetupCalls,
  firstSetupConfigurations,
  requestedConfigurations,
  type PolicyEngine,
  type TokenAllowlist,
} from '../../../../../e2e/src/seed/policy-guard-configuration'
import { createFirstSetupTxs, getConfigurationRoot } from '../policyGuardEncoders'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const engine: PolicyEngine = {
  guard: randomAddress(),
  erc20TransferPolicy: randomAddress(),
  allowPolicy: randomAddress(),
}
const allowlist: TokenAllowlist = { token: randomAddress(), recipients: [randomAddress(), randomAddress()] }
const safe = randomAddress()

describe('the e2e allowlist seed', () => {
  it('requests the configuration root the wallet computes for the same configurations', () => {
    const root = configurationRootOf(allowlist, safe, engine)

    expect(root).toBe(getConfigurationRoot(requestedConfigurations(allowlist, safe, engine)))
  })

  it('builds the same first setup transactions as the wallet', () => {
    const calls = firstSetupCalls(allowlist, safe, engine)

    expect(calls).toEqual(
      createFirstSetupTxs({
        safeAddress: safe,
        guardAddress: engine.guard,
        configurations: firstSetupConfigurations(allowlist, safe, engine),
      }),
    )
  })
})
