import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Input } from '@safe-global/views/components/ui/input'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import ChainLogos from '../ChainLogos'
import GroupedAddress from '../GroupedAddress'
import type { MissingSigner } from '../types'
import { NAME_MAX_LENGTH } from './ContactFormDialog'

/** Every imported signer carries this tag; members can remove it afterwards. */
export const IMPORTED_SIGNER_TAG = 'Internal'

export type ImportedSigner = { address: string; name: string; chainIds: string[]; tags: string[] }

type ImportSignersDialogProps = {
  signers: MissingSigner[]
  onImport: (signers: ImportedSigner[]) => void
  onClose: () => void
  isSubmitting?: boolean
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * Names and imports the workspace Safes' signers in one go. A name left empty saves the
 * suggestion, so every signer ends up named.
 */
const ImportSignersDialog = ({ signers, onImport, onClose, isSubmitting = false }: ImportSignersDialogProps) => {
  const [names, setNames] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(signers.map((signer) => [signer.address, true])),
  )

  const selectedCount = signers.filter((signer) => selected[signer.address]).length
  const allSelected = selectedCount === signers.length
  const tooLong = signers.some((signer) => (names[signer.address]?.trim().length ?? 0) > NAME_MAX_LENGTH)

  const toggleAll = (checked: boolean) =>
    setSelected(Object.fromEntries(signers.map((signer) => [signer.address, checked])))

  const submit = () =>
    onImport(
      signers
        .filter((signer) => selected[signer.address])
        .map((signer) => ({
          address: signer.address,
          name: names[signer.address]?.trim() || signer.placeholder,
          chainIds: signer.chains.map((chain) => chain.chainId),
          tags: [IMPORTED_SIGNER_TAG],
        })),
    )

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none" size="md">
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">Import signers</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-4">
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {plural(signers.length, 'signer')} of your workspace Safes {signers.length === 1 ? "isn't" : "aren't"} in
            the address book. Leave a name empty to keep the suggestion. Imported signers get the{' '}
            <b>{IMPORTED_SIGNER_TAG}</b> tag.
          </Typography>

          <div className="border-border overflow-hidden rounded-lg border">
            <label className="border-border bg-muted/40 flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedCount > 0 && !allSelected}
                onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                aria-label="Select all signers"
              />
              <span className="text-muted-foreground">
                {selectedCount} of {signers.length} selected
              </span>
            </label>

            <ul className="divide-border max-h-[min(24rem,50vh)] divide-y overflow-y-auto">
              {signers.map((signer) => {
                const isSelected = Boolean(selected[signer.address])
                const name = names[signer.address] ?? ''
                const signerOf = `Signer of ${signer.safes.join(', ')}`
                return (
                  <li key={signer.address} className="flex items-start gap-3 px-3 py-2.5">
                    <Checkbox
                      className="mt-2"
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        setSelected((prev) => ({ ...prev, [signer.address]: Boolean(checked) }))
                      }
                      aria-label={`Import ${signer.address}`}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          inputSize="sm"
                          placeholder={signer.placeholder}
                          aria-label={`Name for ${signer.address}`}
                          aria-invalid={name.trim().length > NAME_MAX_LENGTH || undefined}
                          disabled={!isSelected}
                          value={name}
                          onChange={(event) => setNames((prev) => ({ ...prev, [signer.address]: event.target.value }))}
                        />
                        <ChainLogos chains={signer.chains} />
                      </div>
                      <div className="flex min-w-0 items-center gap-2 text-xs">
                        <GroupedAddress address={signer.address} className="text-[11px]" />
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="text-muted-foreground min-w-0 cursor-default truncate" />}
                          >
                            {signerOf}
                          </TooltipTrigger>
                          <TooltipContent>{signerOf}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="submit"
            onClick={submit}
            disabled={selectedCount === 0 || tooLong || isSubmitting}
            data-testid="import-signers-btn"
          >
            {isSubmitting ? <Spinner /> : `Import ${plural(selectedCount, 'signer')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportSignersDialog
