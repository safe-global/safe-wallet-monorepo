import { useId, useState, type ReactElement } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { M2Alert } from './m2Alert'
import { CHAIN_NAMES } from './m2OverviewPage'
import {
  getAccountKey,
  OPERATIONS,
  PAYMENTS,
  PAYMENTS_ARBITRUM,
  SafeAddress,
  TRADING_DESK,
  TREASURY,
  TREASURY_BASE,
  VAULT_3,
  type M2Account,
} from './m2Prototype'

const WORKSPACE_ACCOUNTS: M2Account[] = [
  PAYMENTS,
  PAYMENTS_ARBITRUM,
  TREASURY,
  TREASURY_BASE,
  TRADING_DESK,
  VAULT_3,
  OPERATIONS,
]

export type CopyPolicyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The account whose protection is the template. */
  source: M2Account
  /** Accounts that already have account protection (getAccountKey): they can't take a second one. */
  protectedAccountKeys: string[]
  /** "3 recipients · 4 tokens": what gets copied. */
  templateSummary: string
}

/** Sets up the same account protection on other Safe accounts, one setup transaction per account. */
export const CopyPolicyDialog = ({
  open,
  onOpenChange,
  source,
  protectedAccountKeys,
  templateSummary,
}: CopyPolicyDialogProps): ReactElement => {
  const [selected, setSelected] = useState<string[]>([])
  const idPrefix = useId()
  const dispatch = useAppDispatch()
  const sourceKey = getAccountKey(source)
  const targets = WORKSPACE_ACCOUNTS.filter((account) => getAccountKey(account) !== sourceKey)
  const pickedOtherNetwork = targets.some(
    (account) => selected.includes(getAccountKey(account)) && account.chainId !== source.chainId,
  )

  const close = () => {
    setSelected([])
    onOpenChange(false)
  }

  const copy = () => {
    dispatch(
      showNotification({
        message: `Setup started on ${selected.length} Safe ${selected.length === 1 ? 'account' : 'accounts'}. Each one needs its own signatures.`,
        variant: 'success',
        groupKey: 'copy-policy-prototype',
      }),
    )
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent size="default" data-m2-new="New · Copy to other Safe accounts">
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-semibold">Copy to other Safe accounts</DialogTitle>
          <DialogDescription>
            Set up the same account protection from {source.name} ({templateSummary}). Each Safe account signs its own
            setup.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            {targets.map((account) => {
              const key = getAccountKey(account)
              const isProtected = protectedAccountKeys.includes(key)
              const id = `${idPrefix}-${key}`

              return (
                <label
                  key={key}
                  htmlFor={id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border p-3',
                    isProtected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted',
                  )}
                >
                  <Checkbox
                    id={id}
                    disabled={isProtected}
                    checked={selected.includes(key)}
                    onCheckedChange={(checked) =>
                      setSelected(checked ? [...selected, key] : selected.filter((item) => item !== key))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <SafeAddress name={account.name} address={account.address} chainId={account.chainId} />
                  </div>
                  {isProtected ? (
                    <Typography variant="paragraph-small" color="muted">
                      Already protected
                    </Typography>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ChainIndicator chainId={account.chainId} onlyLogo imageSize={20} />
                      <Typography variant="paragraph-small" color="muted">
                        {CHAIN_NAMES[account.chainId] ?? account.chainId}
                      </Typography>
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {pickedOtherNetwork && (
            <M2Alert
              tone="warning"
              title="Check the recipients on other networks"
              description="The same address can belong to someone else on another network. Review each setup before signing."
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button disabled={selected.length === 0} onClick={copy}>
            {selected.length === 0
              ? 'Copy'
              : `Copy to ${selected.length} Safe ${selected.length === 1 ? 'account' : 'accounts'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
