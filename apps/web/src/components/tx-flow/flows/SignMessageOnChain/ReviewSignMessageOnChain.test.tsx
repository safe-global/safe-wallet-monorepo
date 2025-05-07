import { Methods } from '@safe-global/safe-apps-sdk'
import * as web3 from '@/hooks/wallets/web3'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { render, screen } from '@/tests/test-utils'
import * as execThroughRoleHooks from '@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'
import type { TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { SafeAppAccessPolicyTypes } from '@safe-global/safe-gateway-typescript-sdk'
import ReviewSignMessageOnChain from '@/components/tx-flow/flows/SignMessageOnChain/ReviewSignMessageOnChain'
import { JsonRpcProvider } from 'ethers'
import { act } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { SafeTxContextParams } from '../../SafeTxProvider'
import { SafeTxContext } from '../../SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import * as useTxPreviewHooks from '@/components/tx/confirmation-views/useTxPreview'
import { SlotProvider } from '../../slots'

jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([])
describe('ReviewSignMessageOnChain', () => {
  test('can handle messages with EIP712Domain type in the JSON-RPC payload', async () => {
    jest.spyOn(useTxPreviewHooks, 'default').mockReturnValue([
      {
        txInfo: {},
        txData: { to: { value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67' } },
      } as TransactionPreview,
      undefined,
      false,
    ])
    jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(() => new JsonRpcProvider())
    const safeAddress = faker.finance.ethereumAddress()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .build(),
      safeLoaded: true,
      safeLoading: false,
    })

    await act(async () => {
      render(
        <SafeTxContext.Provider
          value={
            {
              safeTx: createSafeTx(),
            } as SafeTxContextParams
          }
        >
          <SlotProvider>
            <ReviewSignMessageOnChain
              app={{
                id: 73,
                url: 'https://app.com',
                name: 'App',
                iconUrl: 'https://app.com/icon.png',
                description: 'App description',
                chainIds: ['1'],
                tags: [],
                features: [],
                socialProfiles: [],
                developerWebsite: '',
                accessControl: {
                  type: SafeAppAccessPolicyTypes.NoRestrictions,
                },
              }}
              requestId="73"
              message={{
                types: {
                  Vote: [
                    {
                      name: 'from',
                      type: 'address',
                    },
                    {
                      name: 'space',
                      type: 'string',
                    },
                    {
                      name: 'timestamp',
                      type: 'uint64',
                    },
                    {
                      name: 'proposal',
                      type: 'bytes32',
                    },
                    {
                      name: 'choice',
                      type: 'uint32',
                    },
                  ],
                  EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                  ],
                },
                domain: {
                  name: 'snapshot',
                  version: '0.1.4',
                },
                message: {
                  from: '0x292bacf82268e143f5195af6928693699e31f911',
                  space: 'fabien.eth',
                  timestamp: '1663592967',
                  proposal: '0xbe992f0a433d2dbe2e0cee579e5e1bdb625cdcb3a14357ea990c6cdc3e129991',
                  choice: '1',
                },
              }}
              method={Methods.signTypedMessage}
              onSubmit={() => {}}
            />
          </SlotProvider>
        </SafeTxContext.Provider>,
      )
    })

    expect(screen.getByText('Interact with SignMessageLib')).toBeInTheDocument()
  })
})
