import { type ReactElement } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { ASSETS_EVENTS } from '@/services/analytics'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import useBalances from '@/hooks/useBalances'
import Track from '@/components/common/Track'

import css from './styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

const HiddenTokenButton = ({
  toggleShowHiddenAssets,
  showHiddenAssets,
}: {
  toggleShowHiddenAssets?: () => void
  showHiddenAssets?: boolean
}): ReactElement | null => {
  const { balances } = useBalances()
  const currentHiddenAssets = useHiddenTokens()

  const hiddenAssetCount =
    balances.items?.filter((item) => currentHiddenAssets.includes(item.tokenInfo.address)).length || 0

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

export default HiddenTokenButton
