import { useMemo, useState } from 'react'
import { isAddress } from 'ethers'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import GroupedAddress from '../GroupedAddress'
import { AddressAvatar } from '../ContactCell'
import TagPicker from '../tags/TagPicker'
import { TagChips } from '../tags/TagChip'
import { TAGS_DISCLAIMER, hasTag } from '../tags/tagRules'
import type { ChainInfo, TagCount } from '../types'

export const NAME_MAX_LENGTH = 50

export type ContactFormValues = {
  address: string
  name: string
  chainIds: string[]
  tags: string[]
}

type ContactFormDialogProps = {
  mode: 'add' | 'edit'
  /** The contact being edited; ignored when adding. */
  initialValues?: ContactFormValues
  chains: ChainInfo[]
  tagOptions: TagCount[]
  /** Shows the Tags field. Off for the local book, which has no tags. */
  showTags?: boolean
  onSubmit: (values: ContactFormValues) => void
  onClose: () => void
  isSubmitting?: boolean
  error?: string
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value) => b.includes(value))

const validateName = (name: string): string | undefined => {
  const trimmed = name.trim()
  if (!trimmed) return 'Enter a name'
  if (trimmed.length > NAME_MAX_LENGTH) return `Names must be at most ${NAME_MAX_LENGTH} characters long`
  return undefined
}

/** Add a contact, or edit its name, chains and tags. The address of a saved contact is read-only. */
const ContactFormDialog = ({
  mode,
  initialValues,
  chains,
  tagOptions,
  showTags = true,
  onSubmit,
  onClose,
  isSubmitting = false,
  error,
}: ContactFormDialogProps) => {
  const isEdit = mode === 'edit'
  const initial = useMemo<ContactFormValues>(
    () => initialValues ?? { address: '', name: '', chainIds: chains.map((chain) => chain.chainId), tags: [] },
    [initialValues, chains],
  )
  const [values, setValues] = useState<ContactFormValues>(initial)
  const [touched, setTouched] = useState({ address: false, name: false })

  const addressError = !isEdit && !isAddress(values.address.trim()) ? 'Enter a valid address' : undefined
  const nameError = validateName(values.name)
  const chainsError = values.chainIds.length === 0 ? 'Select at least one network' : undefined
  const isValid = !addressError && !nameError && !chainsError

  const hasChanges =
    !isEdit ||
    values.name.trim() !== initial.name ||
    !sameSet(values.chainIds, initial.chainIds) ||
    values.tags.length !== initial.tags.length ||
    values.tags.some((tag) => !hasTag(initial.tags, tag))

  const allChains = values.chainIds.length === chains.length
  const toggleChain = (chainId: string) =>
    setValues((prev) => ({
      ...prev,
      chainIds: prev.chainIds.includes(chainId)
        ? prev.chainIds.filter((id) => id !== chainId)
        : [...prev.chainIds, chainId],
    }))

  const submit = () => {
    setTouched({ address: true, name: true })
    if (!isValid) return
    onSubmit({ ...values, address: values.address.trim(), name: values.name.trim() })
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none">
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">{isEdit ? 'Edit contact' : 'Add contact'}</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-5 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          id="contact-form"
        >
          {isEdit ? (
            <div className="bg-muted/40 flex items-center gap-2 rounded-md px-3 py-2.5">
              <AddressAvatar address={values.address} />
              <GroupedAddress address={values.address} />
            </div>
          ) : (
            <Field data-invalid={(touched.address && Boolean(addressError)) || undefined}>
              <FieldLabel htmlFor="contact-address">Address</FieldLabel>
              <Input
                id="contact-address"
                placeholder="0x…"
                autoComplete="off"
                value={values.address}
                aria-invalid={touched.address && Boolean(addressError)}
                onChange={(event) => setValues((prev) => ({ ...prev, address: event.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
              />
              {touched.address && addressError && <FieldError>{addressError}</FieldError>}
              {!addressError && <GroupedAddress address={values.address.trim()} />}
            </Field>
          )}

          <Field data-invalid={(touched.name && Boolean(nameError)) || undefined}>
            <FieldLabel htmlFor="contact-name">Name</FieldLabel>
            <Input
              id="contact-name"
              placeholder="e.g. Payroll Safe"
              autoComplete="off"
              maxLength={NAME_MAX_LENGTH + 10}
              value={values.name}
              aria-invalid={touched.name && Boolean(nameError)}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            />
            {touched.name && nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Networks</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  setValues((prev) => ({ ...prev, chainIds: allChains ? [] : chains.map((chain) => chain.chainId) }))
                }
              >
                {allChains ? 'Clear all' : 'Select all'}
              </Button>
            </div>
            <FieldDescription>Save the contact on every network, or only where you use it.</FieldDescription>
            <div className="border-border grid grid-cols-2 gap-1 rounded-md border p-1">
              {chains.map((chain) => (
                <label
                  key={chain.chainId}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={values.chainIds.includes(chain.chainId)}
                    onCheckedChange={() => toggleChain(chain.chainId)}
                  />
                  {chain.logoUri && <img src={chain.logoUri} alt="" width={16} height={16} className="size-4" />}
                  {chain.name}
                </label>
              ))}
            </div>
            {chainsError && <FieldError>{chainsError}</FieldError>}
          </Field>

          {showTags && (
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <FieldDescription>{TAGS_DISCLAIMER}</FieldDescription>
              <div className="flex flex-wrap items-center gap-2">
                <TagPicker
                  value={values.tags}
                  onChange={(tags) => setValues((prev) => ({ ...prev, tags }))}
                  options={tagOptions}
                  showCounts={false}
                />
                <TagChips tags={values.tags} maxVisible={10} />
              </div>
            </Field>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="contact-form"
            size="submit"
            disabled={!hasChanges || isSubmitting || (isEdit && !isValid)}
            data-testid="contact-form-submit"
          >
            {isSubmitting ? <Spinner /> : isEdit ? 'Save' : 'Add contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ContactFormDialog
