import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { useGnosisPayDelayModifier } from './hooks/useGnosisPayDelayModifier'
import SendToBlock from '@/components/tx/SendToBlock'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { camelCaseToSpaces } from '@safe-global/utils/utils/formatters'
import CheckWallet from '@/components/common/CheckWallet'
import TxSubmitError from '@/components/tx/TxSubmitError'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { type SyntheticEvent, useCallback, useContext, useState } from 'react'
import { didRevert } from '@/utils/ethers-utils'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { trackError, Errors } from '@/services/exceptions'
import { TxModalContext } from '@/components/tx-flow'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { refreshGnosisPayQueue } from './hooks/useGnosisPayQueue'

const SkipExpiredGnosisPayTx = () => {
  const [delayModifier] = useGnosisPayDelayModifier()
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
      refreshGnosisPayQueue()
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
        <div className="mb-4 flex flex-col gap-4">
          <Typography>This transaction skips all queued and expired transactions.</Typography>

          {delayModifierAddress && <SendToBlock address={delayModifierAddress} title="Interact with" />}
          <FieldsGrid title="Method">
            <Typography variant="paragraph-small-bold">{camelCaseToSpaces('skipExpired')}</Typography>
          </FieldsGrid>

          <NetworkWarning />

          {submitError && <TxSubmitError error={submitError} />}
        </div>

        <Separator bleed="6" className="my-7" />

        <TxCardActions>
          {/* Anyone can skip expired txs */}
          <CheckWallet allowNonOwner checkNetwork>
            {(isOk) => (
              <Button variant="default" size="submit" type="submit" disabled={!isOk || !isSubmittable}>
                {!isSubmittable ? <Spinner className="size-5" /> : 'Execute'}
              </Button>
            )}
          </CheckWallet>
        </TxCardActions>
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
