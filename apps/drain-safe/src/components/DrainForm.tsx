import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import { useChain } from '../hooks/useChain'
import { resolveRecipient } from '../utils/recipient'
import { isNativeToken, tokenToTx } from '../utils/transfers'
import BalancesTable from './BalancesTable'

const SUCCESS_MESSAGE_MS = 5000

const submitLabel = (count: number, total: number): string => {
  if (count === 0) return 'No tokens selected'
  if (count === total) return 'Transfer everything'
  return `Transfer ${count} asset${count > 1 ? 's' : ''}`
}

function DrainForm({ assets }: { assets: TokenBalance[] }) {
  const { sdk } = useSafeAppsSDK()
  const { networkPrefix, gasPrice, resolveName } = useChain()
  const allTokens = useMemo(() => assets.map((item) => item.tokenInfo.address), [assets])
  const [selected, setSelected] = useState(allTokens)
  const [recipient, setRecipient] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(() => setFinished(false), SUCCESS_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [finished])

  const nativeFiatPrice = Number(assets.find(isNativeToken)?.fiatConversion ?? 0)

  // A ref, not state: a second click can arrive before React re-renders with `submitting`
  const isSending = useRef(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSending.current) return
    isSending.current = true
    setSubmitting(true)

    try {
      const to = await resolveRecipient(recipient, networkPrefix, resolveName)
      if (!to) {
        setError('Please enter a valid recipient address')
        return
      }

      setError('')
      const txs = assets.filter((item) => selected.includes(item.tokenInfo.address)).map((item) => tokenToTx(to, item))
      await sdk.txs.send({ txs })
      setFinished(true)
      setRecipient('')
      setSelected(allTokens)
    } catch (sendError) {
      setError(`Failed sending transactions: ${(sendError as Error).message}`)
    } finally {
      isSending.current = false
      setSubmitting(false)
    }
  }

  return (
    <Stack component="form" gap={2} onSubmit={onSubmit} noValidate>
      {error && <Typography color="error">{error}</Typography>}

      <BalancesTable
        assets={assets}
        selected={selected}
        onSelectionChange={setSelected}
        gasPrice={gasPrice}
        nativeFiatPrice={nativeFiatPrice}
      />

      {finished && (
        <Typography>
          The transaction has been created. ✅
          <br />
          Refresh the app when it’s executed.
        </Typography>
      )}

      {submitting ? (
        <Stack alignItems="center" gap={2}>
          <CircularProgress size={32} />
          <Button variant="outlined" onClick={() => setSubmitting(false)}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <>
          <TextField
            label="Recipient"
            value={recipient}
            onChange={(event) => {
              setRecipient(event.target.value)
              setError('')
            }}
            slotProps={{
              input: {
                startAdornment: networkPrefix && <InputAdornment position="start">{networkPrefix}:</InputAdornment>,
              },
            }}
          />
          <Stack alignItems="center">
            <Button type="submit" variant="contained" size="large" disabled={selected.length === 0}>
              {submitLabel(selected.length, assets.length)}
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default DrainForm
