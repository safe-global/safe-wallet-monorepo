import { type ReactElement } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import Track from '@/components/common/Track'
import { maybePlural } from '@safe-global/utils/utils/formatters'

import css from './styles.module.css'

export type HiddenTokenButtonViewProps = {
  hiddenAssetCount: number
  toggleShowHiddenAssets?: () => void
  showHiddenAssets?: boolean
}

export const HiddenTokenButtonView = ({
  hiddenAssetCount,
  toggleShowHiddenAssets,
  showHiddenAssets,
}: HiddenTokenButtonViewProps): ReactElement => {
  return (
    <div className={css.hiddenTokenButton}>
      <Track {...ASSETS_EVENTS.SHOW_HIDDEN_ASSETS}>
        <Button
          variant="outline"
          className="gap-2 border border-[var(--color-border-main)] p-2"
          disabled={showHiddenAssets}
          onClick={toggleShowHiddenAssets}
          data-testid="toggle-hidden-assets"
        >
          <Eye className="size-5" />
          <Typography variant="paragraph-small">
            {hiddenAssetCount === 0
              ? 'Hide tokens'
              : `${hiddenAssetCount} hidden token${maybePlural(hiddenAssetCount)}`}{' '}
          </Typography>
        </Button>
      </Track>
    </div>
  )
}
