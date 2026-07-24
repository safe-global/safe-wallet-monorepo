import { useCallback } from 'react'
import { isAddress } from 'ethers'
import { Box, IconButton, Stack } from '@mui/material'
import { Plus, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardField } from '../wizardCommon'

export type AddressEntry = { address: string; name?: string }

type AddressSelectorListProps = {
  addresses: AddressEntry[]
  onChange: (addresses: AddressEntry[]) => void
  /** Verb-neutral label for the add button + row aria-labels, e.g. "recipient", "spender". */
  entryLabel?: string
}

const EMPTY_ROW: AddressEntry[] = [{ address: '' }]

const normalize = (address: string) => address.trim().toLowerCase()

/** True if this row's (valid) address already appears in an EARLIER row. */
const isDuplicate = (rows: AddressEntry[], index: number): boolean => {
  const addr = normalize(rows[index].address)
  if (!addr) return false
  return rows.slice(0, index).some((r) => normalize(r.address) === addr)
}

const rowState = (rows: AddressEntry[], index: number): 'default' | 'valid' | 'error' => {
  const address = rows[index].address.trim()
  if (!address) return 'default'
  if (!isAddress(address)) return 'error'
  if (isDuplicate(rows, index)) return 'error'
  return 'valid'
}

/**
 * A repeatable list of Ethereum addresses (with optional name). Policy-neutral:
 * used for withdraw recipients in the Token Withdraw policy, for spenders in the
 * Spending Limit policy, etc. ENS resolution and address-book name auto-fill are
 * layered by the caller when it wires this into a wizard step (Step 8).
 */
export const AddressSelectorList = ({ addresses, onChange, entryLabel = 'address' }: AddressSelectorListProps) => {
  // Always render at least one row. Never mutate the incoming array in place.
  const rows = addresses.length > 0 ? addresses : EMPTY_ROW

  const updateRow = useCallback(
    (index: number, patch: Partial<AddressEntry>) => {
      onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
    },
    [rows, onChange],
  )

  const addRow = useCallback(() => onChange([...rows, { address: '' }]), [rows, onChange])

  const removeRow = useCallback(
    (index: number) => {
      const next = rows.filter((_, i) => i !== index)
      onChange(next.length > 0 ? next : [{ address: '' }])
    },
    [rows, onChange],
  )

  // Can't add a new row while any existing row is empty or a duplicate.
  const hasEmptyRow = rows.some((r) => !r.address.trim())
  const hasDuplicate = rows.some((_, i) => isDuplicate(rows, i))
  const canAdd = !hasEmptyRow && !hasDuplicate

  return (
    <Stack gap={1}>
      {rows.map((row, index) => (
        // Key by index intentionally: rows are positional and fully controlled
        // (value comes from `row.address`), so React reuses the input by slot and
        // removing a row re-renders every remaining slot from its own `row`.
        <Stack key={index} direction="row" alignItems="center" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <WizardField
              icon={<User size={16} color="#737373" />}
              value={row.address}
              onChange={(value) => updateRow(index, { address: value })}
              placeholder="0x… or name.eth"
              state={rowState(rows, index)}
              ariaLabel={`${entryLabel} ${index + 1}`}
            />
          </Box>
          {rows.length > 1 && (
            <IconButton
              aria-label={`Remove ${entryLabel} ${index + 1}`}
              onClick={() => removeRow(index)}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </Stack>
      ))}

      <Button variant="outline" size="sm" onClick={addRow} disabled={!canAdd} className="self-start">
        <Plus size={16} /> Add {entryLabel}
      </Button>
    </Stack>
  )
}
