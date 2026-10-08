import type { UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw } from 'lucide-react'
import NumberField from '@/components/common/NumberField'

export type GasLimitInputViewProps = {
  error?: { message: string; type: string }
  showReset: boolean
  onResetGasLimit: () => void
  disabled: boolean
  field: UseFormRegisterReturn
}

export const GasLimitInputView = ({ error, showReset, onResetGasLimit, disabled, field }: GasLimitInputViewProps) => {
  const errorMessage = error ? (error.type === 'min' ? 'Gas limit must be at least 21000' : error.message) : undefined

  return (
    <div className="w-full">
      <NumberField
        fullWidth
        label={errorMessage || 'Gas limit'}
        error={!!errorMessage}
        // Always pass a truthy adornment: NumberField switches between a bare Input and an
        // InputGroup based on it, and swapping remounts the input mid-typing (losing focus).
        endAdornment={
          <>
            {showReset && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onResetGasLimit}
                      className="text-primary"
                      aria-label="Reset to recommended gas limit"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent>Reset to recommended gas limit</TooltipContent>
              </Tooltip>
            )}
          </>
        }
        disabled={disabled}
        required
        {...field}
      />
    </div>
  )
}
