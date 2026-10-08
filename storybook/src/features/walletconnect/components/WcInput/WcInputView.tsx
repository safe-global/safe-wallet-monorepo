import Track from '@/components/common/Track'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'

export type WcInputViewProps = {
  inputId: string
  value: string
  errorMessage?: string
  isClipboardSupported: boolean
  isDisabled: boolean
  isConnecting: boolean
  onInput: (value: string) => void
  onPaste: () => void
}

export const WcInputView = ({
  inputId,
  value,
  errorMessage,
  isClipboardSupported,
  isDisabled,
  isConnecting,
  onInput,
  onPaste,
}: WcInputViewProps) => {
  const hasError = errorMessage !== undefined
  const label = hasError ? errorMessage : 'Pairing code'

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <Label htmlFor={inputId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      {isClipboardSupported ? (
        <Input
          id={inputId}
          data-testid="wc-input"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          autoComplete="off"
          autoFocus
          disabled={isDisabled}
          aria-invalid={hasError}
          placeholder="wc:"
          spellCheck={false}
        />
      ) : (
        <InputGroup>
          <InputGroupInput
            id={inputId}
            data-testid="wc-input"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={isDisabled}
            aria-invalid={hasError}
            placeholder="wc:"
            spellCheck={false}
          />
          <InputGroupAddon align="inline-end" className="pr-0">
            <Track {...WALLETCONNECT_EVENTS.PASTE_CLICK}>
              <Button variant="default" size="sm" onClick={onPaste} disabled={isDisabled}>
                {isConnecting ? <Spinner className="size-5" /> : 'Paste'}
              </Button>
            </Track>
          </InputGroupAddon>
        </InputGroup>
      )}
    </div>
  )
}
