import { faker } from '@faker-js/faker'
import { AbiCoder, ZeroAddress, getAddress } from 'ethers'
import { SAFE_SETTER_SELECTORS } from '@/features/policy-guard/public/services/guardExit'
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

  it('requests the cleared guard exit, then the token rule that always allows each recipient', () => {
    const configurations = requestedConfigurations(allowlist, safe, engine)
    const tokenRule = configurations.at(-1)

    expect(configurations.slice(0, -1)).toEqual(
      SAFE_SETTER_SELECTORS.map((selector) => ({
        target: safe,
        selector,
        operation: 0,
        policy: ZeroAddress,
        data: '0x',
      })),
    )
    expect(tokenRule).toMatchObject({
      target: allowlist.token,
      selector: '0xa9059cbb',
      policy: engine.erc20TransferPolicy,
    })
    expect(
      AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], tokenRule!.data)[0].toArray(),
    ).toEqual(allowlist.recipients.map((recipient) => [recipient, 2n]))
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
