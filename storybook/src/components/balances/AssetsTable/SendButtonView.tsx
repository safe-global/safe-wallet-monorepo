import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ArrowIconNW from '@/public/images/common/arrow-up-right.svg'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import css from '@/components/common/AssetActionButton/styles.module.css'

export type SendButtonViewProps = {
  isOk: boolean
  onClick: () => void
  light?: boolean
  onlyIcon?: boolean
}

export const SendButtonView = ({ isOk, onClick, light, onlyIcon = false }: SendButtonViewProps) => {
  return (
    <Track {...ASSETS_EVENTS.SEND}>
      {onlyIcon ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button
                  variant="ghost"
                  data-testid="send-button"
                  onClick={onClick}
                  disabled={!isOk}
                  aria-label="Send"
                  className={`size-7 min-w-7 p-1.5 ${css.assetActionIconButton}`}
                >
                  <ArrowIconNW />
                </Button>
              </span>
            }
          />
          {isOk && <TooltipContent>Send</TooltipContent>}
        </Tooltip>
      ) : (
        <Button
          data-testid="send-button"
          variant={light ? 'secondary' : 'default'}
          onClick={onClick}
          disabled={!isOk}
          // eslint-disable-next-line no-restricted-syntax -- faithful css-module port of .sendButton (h-8 + px:var(--space-2)), pixel-identical; bespoke value has no variant
          className="h-8 px-[var(--space-2)]"
        >
          <ArrowIconNW />
          Send
        </Button>
      )}
    </Track>
  )
}
