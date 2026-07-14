import { Sticky } from '@/components/common/Sticky'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics'
import { EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

const TokenMenu = ({
  saveChanges,
  cancel,
  selectedAssetCount,
  showHiddenAssets,
  deselectAll,
}: {
  saveChanges: () => void
  cancel: () => void
  deselectAll: () => void
  selectedAssetCount: number
  showHiddenAssets: boolean
}) => {
  if (selectedAssetCount === 0 && !showHiddenAssets) {
    return null
  }
  return (
    <Sticky>
      <div className={css.wrapper}>
        <div className={css.hideTokensHeader}>
          <EyeOff />
          <Typography variant="paragraph-small" className="leading-[inherit]">
            {selectedAssetCount} {selectedAssetCount === 1 ? 'token' : 'tokens'} selected
          </Typography>
        </div>
        <div className="flex flex-row gap-2">
          <Track {...ASSETS_EVENTS.CANCEL_HIDE_DIALOG}>
            <Button
              onClick={cancel}
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke value has no variant
              className="py-[4px] px-[10px]"
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </Track>
          <Track {...ASSETS_EVENTS.DESELECT_ALL_HIDE_DIALOG}>
            <Button
              onClick={deselectAll}
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke value has no variant
              className="py-[4px] px-[10px]"
              size="sm"
              variant="outline"
            >
              Deselect all
            </Button>
          </Track>
          <Track {...ASSETS_EVENTS.SAVE_HIDE_DIALOG}>
            <Button
              onClick={saveChanges}
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke value has no variant
              className="py-[6px] px-[var(--space-3)]"
              size="sm"
              variant="default"
            >
              Save
            </Button>
          </Track>
        </div>
      </div>
    </Sticky>
  )
}

export default TokenMenu
