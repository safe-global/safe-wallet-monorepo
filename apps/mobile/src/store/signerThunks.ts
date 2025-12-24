import { AppDispatch, RootState } from '.'
import { addSigner, Signer } from './signersSlice'
import { setActiveSigner } from './activeSignerSlice'
import { addContact } from './addressBookSlice'

export const addSignerWithEffects =
  (signerInfo: Signer) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { activeSafe, activeSigner } = getState()
    const signerName = signerInfo.name || `Signer-${signerInfo.value.slice(-4)}`

    dispatch(addSigner(signerInfo))

    if (activeSafe && !activeSigner[activeSafe.address]) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer: signerInfo }))
    }

    dispatch(
      addContact({
        value: signerInfo.value,
        name: signerName,
        chainIds: [],
      }),
    )
  }
