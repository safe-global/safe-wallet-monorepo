import type { ReactElement, SyntheticEvent } from 'react'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Separator } from '@/components/ui/separator'

export type BatchingViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  slotId?: string
  onChange: (id: string) => void
  options: { label: string; id: string }[]
  disabled: boolean
  loading: boolean
}

export const BatchingView = ({
  onSubmit,
  slotId,
  onChange,
  options,
  disabled,
  loading,
}: BatchingViewProps): ReactElement => {
  return (
    <div>
      <Separator bleed="6" />

      <TxCardActions>
        <SplitMenuButton
          onClick={(_, e) => onSubmit(e)}
          selected={slotId}
          onChange={({ id }) => onChange(id)}
          options={options}
          disabled={disabled}
          loading={loading}
        />
      </TxCardActions>
    </div>
  )
}
