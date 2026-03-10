import { AppDispatch, RootState } from '.'
import { addSigner, Signer } from './signersSlice'
import { setActiveSigner } from './activeSignerSlice'
import { addContact } from './addressBookSlice'
import { selectAllSafes } from './safesSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const computeSignerChainIds = (signerAddress: string, state: RootState): string[] => {
  const safes = selectAllSafes(state)
  const chainIdSet = new Set<string>()

  for (const chainMap of Object.values(safes)) {
    for (const [chainId, overview] of Object.entries(chainMap)) {
      if (overview.owners.some((o) => sameAddress(o.value, signerAddress))) {
        chainIdSet.add(chainId)
      }
    }
  }

  return [...chainIdSet]
}

export const addSignerWithEffects =
  (signerInfo: Signer) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState()
    const { activeSafe, activeSigner } = state
    const signerName = signerInfo.name || `Signer-${signerInfo.value.slice(-4)}`

    dispatch(addSigner(signerInfo))

    if (activeSafe && !activeSigner[activeSafe.address]) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer: signerInfo }))
    }

    const signerChainIds = computeSignerChainIds(signerInfo.value, state)

    dispatch(
      addContact({
        value: signerInfo.value,
        name: signerName,
        chainIds: signerChainIds,
      }),
    )
  }
