import { faker } from '@faker-js/faker'
import { Interface, ZeroAddress, getAddress, makeError } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { COSIGNER_POLICY_ABI, POLICY_GUARD_GET_POLICY_ABI } from '../constants'
import { resolveCosignerRequirement, type EthCall } from '../requirement'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const guardInterface = new Interface(POLICY_GUARD_GET_POLICY_ABI)
const cosignerInterface = new Interface(COSIGNER_POLICY_ABI)
const multiSendInterface = new Interface(['function multiSend(bytes transactions)'])
const erc20Interface = new Interface(['function transfer(address to, uint256 amount)'])

const CALL = 0
const DELEGATE_CALL = 1

const address = () => randomAddress()

const accessFor = (to: string, data: string, operation: number): bigint => {
  const selector = data.length >= 10 ? BigInt(data.slice(0, 10)) : 0n
  return BigInt(to) | (selector << 224n) | (BigInt(operation) << 216n)
}
const fallbackAccess = (operation: number): bigint => BigInt(operation) << 216n

const transfer = (token: string) => ({
  to: token,
  value: '0',
  data: erc20Interface.encodeFunctionData('transfer', [address(), faker.number.bigInt({ min: 1n, max: 10n ** 18n })]),
  operation: CALL,
})

const multiSendTx = (multiSend: string, actions: ReturnType<typeof transfer>[]) => ({
  to: multiSend,
  data: multiSendInterface.encodeFunctionData('multiSend', [encodeMultiSendData(actions)]),
  operation: DELEGATE_CALL,
})

type Routing = {
  guard: string
  policyFor: (to: string, data: string, operation: number) => { access: bigint; policy: string }
  cosigners: Map<string, Map<bigint, string>>
}

const fakeChain =
  ({ guard, policyFor, cosigners }: Routing): EthCall =>
  async ({ to, data }) => {
    if (to === guard) {
      const [, target, txData, operation] = guardInterface.decodeFunctionData('getPolicy', data)
      const { access, policy } = policyFor(target, txData, Number(operation))
      return guardInterface.encodeFunctionResult('getPolicy', [access, policy])
    }
    const configured = cosigners.get(to)
    if (!configured) {
      throw makeError('execution reverted', 'CALL_EXCEPTION', {
        action: 'call',
        data: '0x',
        reason: null,
        transaction: { to, data },
        invocation: null,
        revert: null,
      })
    }
    const [, , access] = cosignerInterface.decodeFunctionData('getCoSigner', data)
    return cosignerInterface.encodeFunctionResult('getCoSigner', [configured.get(access) ?? ZeroAddress])
  }

describe('resolveCosignerRequirement', () => {
  const guard = address()
  const safe = address()
  const cosignerPolicy = address()
  const otherPolicy = address()
  const cosigner = address()

  it('requires one co-signature when the access is bound to a CoSignerPolicy', async () => {
    const tx = transfer(address())
    const access = accessFor(tx.to, tx.data, CALL)
    const call = fakeChain({
      guard,
      policyFor: () => ({ access, policy: cosignerPolicy }),
      cosigners: new Map([[cosignerPolicy, new Map([[access, cosigner]])]]),
    })

    const requirement = await resolveCosignerRequirement(call, guard, safe, tx)

    expect(requirement).toEqual({ mode: 'single', cosigner, policy: cosignerPolicy, access })
  })

  it('requires nothing when the policy is not a CoSignerPolicy', async () => {
    const tx = transfer(address())
    const call = fakeChain({
      guard,
      policyFor: (to, data, operation) => ({ access: accessFor(to, data, operation), policy: otherPolicy }),
      cosigners: new Map(),
    })

    expect(await resolveCosignerRequirement(call, guard, safe, tx)).toEqual({ mode: 'none' })
  })

  it('requires nothing when no policy is configured for the access', async () => {
    const tx = transfer(address())
    const call = fakeChain({ guard, policyFor: () => ({ access: 0n, policy: ZeroAddress }), cosigners: new Map() })

    expect(await resolveCosignerRequirement(call, guard, safe, tx)).toEqual({ mode: 'none' })
  })

  it('requires one co-signature for a batch when the co-signer is the delegate call fallback', async () => {
    const tx = multiSendTx(address(), [transfer(address()), transfer(address())])
    const access = fallbackAccess(DELEGATE_CALL)
    const call = fakeChain({
      guard,
      policyFor: () => ({ access, policy: cosignerPolicy }),
      cosigners: new Map([[cosignerPolicy, new Map([[access, cosigner]])]]),
    })

    expect(await resolveCosignerRequirement(call, guard, safe, tx)).toMatchObject({ mode: 'single', cosigner })
  })

  it('requires a co-signature per action when a MultiSendPolicy routes an action to a CoSignerPolicy', async () => {
    const coSignedAction = transfer(address())
    const tx = multiSendTx(address(), [transfer(address()), coSignedAction])
    const coSignedAccess = accessFor(coSignedAction.to, coSignedAction.data, CALL)
    const call = fakeChain({
      guard,
      policyFor: (to, data, operation) =>
        to === tx.to
          ? { access: accessFor(to, data, operation), policy: otherPolicy }
          : { access: accessFor(to, data, operation), policy: to === coSignedAction.to ? cosignerPolicy : otherPolicy },
      cosigners: new Map([[cosignerPolicy, new Map([[coSignedAccess, cosigner]])]]),
    })

    expect(await resolveCosignerRequirement(call, guard, safe, tx)).toEqual({ mode: 'perAction' })
  })

  it('requires nothing for a batch under a fallback policy even if an action has a co-signer', async () => {
    const coSignedAction = transfer(address())
    const tx = multiSendTx(address(), [coSignedAction])
    const call = fakeChain({
      guard,
      policyFor: (to, data, operation) =>
        to === tx.to
          ? { access: fallbackAccess(DELEGATE_CALL), policy: otherPolicy }
          : { access: accessFor(to, data, operation), policy: cosignerPolicy },
      cosigners: new Map([
        [cosignerPolicy, new Map([[accessFor(coSignedAction.to, coSignedAction.data, CALL), cosigner]])],
      ]),
    })

    expect(await resolveCosignerRequirement(call, guard, safe, tx)).toEqual({ mode: 'none' })
  })

  it('propagates an RPC failure instead of treating it as no co-signer', async () => {
    const tx = transfer(address())
    const rpcError = new Error('network down')
    const call: EthCall = async ({ to }) => {
      if (to === guard) {
        return guardInterface.encodeFunctionResult('getPolicy', [accessFor(tx.to, tx.data, CALL), cosignerPolicy])
      }
      throw rpcError
    }

    await expect(resolveCosignerRequirement(call, guard, safe, tx)).rejects.toBe(rpcError)
  })
})
