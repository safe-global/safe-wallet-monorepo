import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { XIcon } from 'lucide-react'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import SettingsCard from '@/components/settings/SettingsCard'

export type FeeTokenOption = {
  name: string
  address: string
  balance: bigint
  decimals: number
}

export type FeeTokenPreferenceViewProps = {
  hasWallet: boolean
  error?: string
  onDismissError: () => void
  success: boolean
  onDismissSuccess: () => void
  loading: boolean
  saving: boolean
  selectedToken: string
  onSelectToken: (value: string) => void
  tokenOptions: FeeTokenOption[]
  onSave: () => void
}

export const FeeTokenPreferenceView = ({
  hasWallet,
  error,
  onDismissError,
  success,
  onDismissSuccess,
  loading,
  saving,
  selectedToken,
  onSelectToken,
  tokenOptions,
  onSave,
}: FeeTokenPreferenceViewProps) => {
  return (
    <SettingsCard title="Fee token preference" data-testid="fee-token-preference-section" className="mt-4">
      {hasWallet ? (
        <div>
          <Typography className="mb-6">
            Select your preferred token for paying transaction fees on Tempo. This preference will be used for all
            future transactions for the connected wallet.
          </Typography>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={onDismissError}>
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-4">
              <AlertSeverityIcon variant="success" />
              <AlertDescription>Fee token preference updated successfully!</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={onDismissSuccess}>
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )}

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="fee-token">Fee token</Label>
            <Select
              value={loading ? null : selectedToken || null}
              onValueChange={(value) => onSelectToken(value as string)}
              disabled={loading || saving}
            >
              <SelectTrigger id="fee-token" className="w-full">
                {loading && <Spinner className="size-5" />}
                <SelectValue placeholder={loading ? 'Loading...' : 'Fee token'} />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((token) => {
                  const balanceStr = formatVisualAmount(token.balance.toString(), token.decimals)

                  return (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex w-full justify-between">
                        <Typography>{token.name}</Typography>
                        <Typography variant="paragraph-small" className="text-muted-foreground">
                          Balance: {balanceStr}
                        </Typography>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onSave} disabled={!selectedToken || saving || loading}>
            {saving ? (
              <>
                <Spinner className="mr-1 size-4" />
                Saving...
              </>
            ) : (
              'Save preference'
            )}
          </Button>
        </div>
      ) : (
        <Typography>Please connect your wallet to configure fee token preference.</Typography>
      )}
    </SettingsCard>
  )
}
