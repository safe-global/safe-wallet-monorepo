import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Input } from '@safe-global/views/components/ui/input'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import ChainLogos from '../ChainLogos'
import GroupedAddress from '../GroupedAddress'
import { describeSuggestion, type SuggestedContact } from '../types'
import { NAME_MAX_LENGTH } from './ContactFormDialog'

export type AddedSuggestion = { address: string; name: string; chainIds: string[] }

type AddSuggestionsDialogProps = {
  suggestions: SuggestedContact[]
  onAdd: (contacts: AddedSuggestion[]) => void
  onClose: () => void
  isSubmitting?: boolean
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Names the chosen suggestions before they join the workspace book. An empty name keeps the suggested one. */
const AddSuggestionsDialog = ({ suggestions, onAdd, onClose, isSubmitting = false }: AddSuggestionsDialogProps) => {
  const [names, setNames] = useState<Record<string, string>>({})
  const tooLong = suggestions.some((item) => (names[item.address]?.trim().length ?? 0) > NAME_MAX_LENGTH)

  const submit = () =>
    onAdd(
      suggestions.map((item) => ({
        address: item.address,
        name: names[item.address]?.trim() || item.suggestedName,
        chainIds: item.chains.map((chain) => chain.chainId),
      })),
    )

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none" size="md">
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">Add to workspace</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-4">
          <Typography variant="paragraph-small" className="text-muted-foreground">
            Everyone in the workspace will see these names. Leave a name empty to keep the suggestion.
          </Typography>

          <ul className="border-border divide-border max-h-[min(24rem,50vh)] divide-y overflow-y-auto rounded-lg border">
            {suggestions.map((item) => {
              const reason = describeSuggestion(item.reason)
              return (
                <li key={item.address} className="flex flex-col gap-1 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      inputSize="sm"
                      placeholder={item.suggestedName}
                      aria-label={`Name for ${item.address}`}
                      aria-invalid={(names[item.address]?.trim().length ?? 0) > NAME_MAX_LENGTH || undefined}
                      value={names[item.address] ?? ''}
                      onChange={(event) => setNames((prev) => ({ ...prev, [item.address]: event.target.value }))}
                    />
                    <ChainLogos chains={item.chains} />
                  </div>
                  {(names[item.address]?.trim().length ?? 0) > NAME_MAX_LENGTH && (
                    <p className="text-destructive text-xs" role="alert">
                      Names must be at most {NAME_MAX_LENGTH} characters long
                    </p>
                  )}
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    <GroupedAddress address={item.address} className="text-[11px]" />
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="text-muted-foreground min-w-0 cursor-default truncate" />}
                      >
                        {reason}
                      </TooltipTrigger>
                      <TooltipContent>{reason}</TooltipContent>
                    </Tooltip>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button size="submit" onClick={submit} disabled={tooLong || isSubmitting} data-testid="add-suggestions-btn">
            {isSubmitting ? <Spinner /> : `Add ${plural(suggestions.length, 'contact')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddSuggestionsDialog
