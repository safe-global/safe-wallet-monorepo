import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import { Button, CardActions, Divider, Typography } from '@mui/material'
import { useGnosisPayDelayModifier } from './hooks/useGnosisPayDelayModifier'
import SendToBlock from '@/components/tx/SendToBlock'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { camelCaseToSpaces } from '@safe-global/utils/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import CheckWallet from '@/components/common/CheckWallet'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { type SyntheticEvent, useCallback, useContext } from 'react'
import { didRevert } from '@/utils/ethers-utils'
import { useAppDispatch } from '@/store'
import { skipExpired } from '@/store/gnosisPayTxsSlice'
import useSafeAddress from '@/hooks/useSafeAddress'
import { TxModalContext } from '@/components/tx-flow'

const SkipExpiredGnosisPayTx = () => {
  const [delayModifier] = useGnosisPayDelayModifier()
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const { setTxFlow } = useContext(TxModalContext)

  const [delayModifierAddress] = useAsync(
    () => delayModifier?.delayModifier.getAddress(),
    [delayModifier?.delayModifier],
  )
  const executeSkipExpired = useCallback(() => {
    if (!delayModifier) {
      return undefined
    }

    return delayModifier.delayModifier.skipExpired()
  }, [delayModifier])

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!executeSkipExpired) {
      return
    }

    const result = await executeSkipExpired()

    result?.wait().then((receipt) => {
      if (receipt === null) {
        throw new Error('No transaction receipt found')
      } else if (didRevert(receipt)) {
        throw new Error('Transaction reverted by EVM')
      } else {
        // We close the modal
        dispatch(skipExpired({ safeAddress }))
        setTxFlow(undefined)
      }
    })
  }

  return (
    <TxCard>
      <form onSubmit={handleSubmit}>
        <Typography>This transaction skips all queued and expired transactions.</Typography>

        {delayModifierAddress && <SendToBlock address={delayModifierAddress} title="Interact with" />}
        <FieldsGrid title="Method">
          <Typography variant="overline" fontWeight="bold" color="border.main">
            {camelCaseToSpaces('skipExpired')}
          </Typography>
        </FieldsGrid>

        <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

        <CardActions>
          {/* Submit button, anyone can skip expired txs */}
          <CheckWallet allowNonOwner>
            {(isOk) => (
              <Button variant="contained" type="submit" disabled={!isOk} sx={{ minWidth: '112px' }}>
                Execute
              </Button>
            )}
          </CheckWallet>
        </CardActions>
      </form>
    </TxCard>
  )
}

const SkipExpiredGnosisPay = () => {
  return (
    <TxLayout title="Skip expired transactions" step={0}>
      <SkipExpiredGnosisPayTx />
    </TxLayout>
  )
}

export default SkipExpiredGnosisPay
