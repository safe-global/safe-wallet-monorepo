import { useId, useState, type FormEvent } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Input } from '@safe-global/views/components/ui/input'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import ChainLogos from './ChainLogos'
import GroupedAddress from './GroupedAddress'
import { describeSuggestion, type SuggestedContact } from './types'

export type NamedContact = { address: string; name: string; chainIds: string[] }

/** A suggestion, or any contact named on its way to the Workspace, which has no reason to show. */
export type ContactToName = Omit<SuggestedContact, 'reason'> & { reason?: SuggestedContact['reason'] }

type NameContactsDialogProps = {
  contacts: ContactToName[]
  validateName: (name: string) => string | undefined
  onConfirm: (contacts: NamedContact[]) => void
  onClose: () => void
  isSubmitting?: boolean
  error?: string
  title?: string
  description?: string
  confirmLabel?: string
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Names contacts before they join the workspace book. An empty name keeps the suggested one. */
const NameContactsDialog = ({
  contacts,
  validateName,
  onConfirm,
  onClose,
  isSubmitting = false,
  error,
  title = 'Add to Workspace',
  description = 'Everyone in the Workspace will see these names. Leave a name empty to keep the suggestion.',
  confirmLabel = `Add ${plural(contacts.length, 'contact')}`,
}: NameContactsDialogProps) => {
  const [names, setNames] = useState<Record<string, string>>({})
  const idPrefix = useId()

  const nameToSave = (item: ContactToName) => names[item.address]?.trim() || item.suggestedName
  const nameError = (item: ContactToName) => validateName(nameToSave(item))
  const hasInvalidName = contacts.some((item) => nameError(item))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (hasInvalidName || isSubmitting) return
    onConfirm(
      contacts.map((item) => ({
        address: item.address,
        name: nameToSave(item),
        chainIds: item.chains.map((chain) => chain.chainId),
      })),
    )
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none" size="md">
        <form onSubmit={submit} className="contents">
          <DialogHeader divided>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-6 py-4">
            <Typography variant="paragraph-small" className="text-muted-foreground">
              {description}
            </Typography>

            <ul className="border-border divide-border max-h-[min(24rem,50vh)] divide-y overflow-y-auto rounded-lg border">
              {contacts.map((item) => {
                const reason = item.reason && describeSuggestion(item.reason)
                const message = nameError(item)
                const errorId = `${idPrefix}-${item.address}-error`
                return (
                  <li key={item.address} className="flex flex-col gap-1 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Input
                        inputSize="sm"
                        placeholder={item.suggestedName}
                        aria-label={`Name for ${item.suggestedName}`}
                        aria-invalid={message ? true : undefined}
                        aria-describedby={message ? errorId : undefined}
                        value={names[item.address] ?? ''}
                        onChange={(event) => setNames((prev) => ({ ...prev, [item.address]: event.target.value }))}
                      />
                      <ChainLogos chains={item.chains} />
                    </div>
                    {message && (
                      <p id={errorId} className="text-destructive text-xs">
                        {message}
                      </p>
                    )}
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                      <GroupedAddress address={item.address} className="text-[11px]" />
                      {reason && (
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="text-muted-foreground min-w-0 cursor-default truncate" />}
                          >
                            {reason}
                          </TooltipTrigger>
                          <TooltipContent>{reason}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {error && (
            <p className="text-destructive px-6 pb-3 text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter divided className="flex-row items-center justify-between">
            <Button type="button" variant="outline" size="submit" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="submit"
              aria-label={confirmLabel}
              disabled={hasInvalidName || isSubmitting}
              data-testid="name-contacts-confirm-btn"
            >
              {isSubmitting ? <Spinner /> : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NameContactsDialog
