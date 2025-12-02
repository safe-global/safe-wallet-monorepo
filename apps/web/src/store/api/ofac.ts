import { createApi } from '@reduxjs/toolkit/query/react'
import { selectChainById } from '@/store/chainsSlice'
import { Contract } from 'ethers'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { RootState } from '..'
import { CHAINALYSIS_OFAC_CONTRACT } from '@/config/constants'
import chains from '@/config/chains'

// Chainalysis contract ABI and address
const contractAbi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'isSanctioned',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

export const ofacApi = createApi({
  reducerPath: 'ofacApi',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getIsSanctioned: builder.query<boolean, string>({
      async queryFn(address, { getState }) {
        const state = getState()
        const chain = selectChainById(state as RootState, chains.eth)

        if (!chain) return createBadRequestError('Chain info not found')
        if (!address) return createBadRequestError('No address provided')

        const provider = createWeb3ReadOnly(chain)
        const contract = new Contract(CHAINALYSIS_OFAC_CONTRACT, contractAbi, provider)

        try {
          const isAddressBlocked: boolean = await contract['isSanctioned'](address)
          return { data: isAddressBlocked }
        } catch (error) {
          return { error }
        }
      },
      keepUnusedDataFor: 24 * 60 * 60, // 24 hours
    }),
  }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetIsSanctionedQuery } = ofacApi
