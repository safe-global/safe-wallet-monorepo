import { useCallback, useMemo } from 'react'
import { isAddress } from 'ethers'
import { IconButton, Stack } from '@mui/material'
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

const rowState = (address: string): 'default' | 'valid' | 'error' => {
  if (!address) return 'default'
  return isAddress(address) ? 'valid' : 'error'
}

/**
 * A repeatable list of Ethereum addresses (with optional name). Policy-neutral:
 * used for withdraw recipients in the Token Withdraw policy, for spenders in the
 * Spending Limit policy, etc. ENS resolution and address-book name auto-fill are
 * layered by the caller when it wires this into a wizard step (Step 8).
 */
export const AddressSelectorList = ({ addresses, onChange, entryLabel = 'address' }: AddressSelectorListProps) => {
  const rows = useMemo(() => (addresses.length > 0 ? addresses : [{ address: '' }]), [addresses])

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

  return (
    <Stack gap={1}>
      {rows.map((row, index) => (
        <Stack key={index} direction="row" alignItems="center" gap={1}>
          <WizardField
            icon={<User size={16} color="#737373" />}
            value={row.address}
            onChange={(value) => updateRow(index, { address: value })}
            placeholder="0x… or name.eth"
            state={rowState(row.address)}
            ariaLabel={`${entryLabel} ${index + 1}`}
          />
          {rows.length > 1 && (
            <IconButton aria-label={`Remove ${entryLabel} ${index + 1}`} onClick={() => removeRow(index)} size="small">
              <Trash2 size={16} />
            </IconButton>
          )}
        </Stack>
      ))}

      <Button variant="outline" size="sm" onClick={addRow} className="self-start">
        <Plus size={16} /> Add {entryLabel}
      </Button>
    </Stack>
  )
}
