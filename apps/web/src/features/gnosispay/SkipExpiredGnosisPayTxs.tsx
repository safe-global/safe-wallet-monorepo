import TxCard from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import { Button, CardActions, Divider, Typography } from '@mui/material'
import { useGnosisPayDelayModifier } from './hooks/useGnosisPayDelayModifier'
import SendToBlock from '@/components/tx/SendToBlock'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { camelCaseToSpaces } from '@safe-global/utils/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import CheckWallet from '@/components/common/CheckWallet'
import ErrorMessage from '@/components/tx/ErrorMessage'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { type SyntheticEvent, useCallback, useContext, useState } from 'react'
import { didRevert } from '@/utils/ethers-utils'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { trackError, Errors } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { skipExpired } from '@/store/gnosisPayTxsSlice'
import useSafeAddress from '@/hooks/useSafeAddress'
import { TxModalContext } from '@/components/tx-flow'

const SkipExpiredGnosisPayTx = () => {
  const [delayModifier] = useGnosisPayDelayModifier()
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const { setTxFlow } = useContext(TxModalContext)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()

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

    setIsSubmittable(false)
    setSubmitError(undefined)

    try {
      const result = await executeSkipExpired()
      const receipt = await result?.wait()
      if (receipt === null || receipt === undefined) {
        throw new Error('No transaction receipt found')
      }
      if (didRevert(receipt)) {
        throw new Error('Transaction reverted by EVM')
      }
      dispatch(skipExpired({ safeAddress }))
      setTxFlow(undefined)
    } catch (_err) {
      const err = asError(_err)
      trackError(Errors._804, err)
      setIsSubmittable(true)
      setSubmitError(err)
    }
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

        {submitError && (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        )}

        <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

        <CardActions>
          {/* Submit button, anyone can skip expired txs */}
          <CheckWallet allowNonOwner>
            {(isOk) => (
              <Button variant="contained" type="submit" disabled={!isOk || !isSubmittable} sx={{ minWidth: '112px' }}>
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
