import type { ReactElement, ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { FieldDescription } from '@/components/ui/field'
import {
  ADD_TOKEN_LABEL,
  REMOVE_SPENDER_LABEL,
  SPENDER_HELPER_TEXT,
  SPENDER_LABEL,
  SPENDER_PLACEHOLDER,
} from '../constants'

/** Figma draws the remove glyph at lucide's 1.5 stroke, not its default 2. */
const ICON_STROKE_WIDTH = 1.5

export type SpenderAddressInputSlotProps = {
  label: string
  placeholder: string
}

export type SpenderCardViewProps = {
  removable: boolean
  onRemove: () => void
  isFixed: boolean
  renderAddressInput: (props: SpenderAddressInputSlotProps) => ReactNode
  limits: ReactNode
  onAddToken: () => void
}

export const SpenderCardView = ({
  removable,
  onRemove,
  isFixed,
  renderAddressInput,
  limits,
  onAddToken,
}: SpenderCardViewProps): ReactElement => (
  <Card variant="muted" size="none" radius="xl" className="relative" data-testid="spender-card">
    {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
    <div className="flex flex-col gap-4 p-4">
      {removable && (
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon-circle"
          aria-label={REMOVE_SPENDER_LABEL}
          onClick={onRemove}
          data-testid="remove-spender-btn"
          /* The address field's wrapper follows this in the DOM and would otherwise paint over it. */
          className="absolute top-2 right-2 z-10"
        >
          <Trash2 strokeWidth={ICON_STROKE_WIDTH} />
        </Button>
      )}

      <div className={cn('flex flex-col gap-1', isFixed && 'cursor-not-allowed opacity-50')}>
        {renderAddressInput({ label: SPENDER_LABEL, placeholder: SPENDER_PLACEHOLDER })}
        <FieldDescription>{SPENDER_HELPER_TEXT}</FieldDescription>
      </div>

      <div className="flex flex-col gap-3">{limits}</div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onAddToken} data-testid="add-token-btn">
          <Plus />
          {ADD_TOKEN_LABEL}
        </Button>
      </div>
    </div>
  </Card>
)
