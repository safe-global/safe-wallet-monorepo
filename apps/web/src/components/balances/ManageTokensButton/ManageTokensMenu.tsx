import { type ReactElement } from 'react'
import { Menu, MenuItem, Box, Typography, Switch, Divider } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTokenList, setHideDust, TOKEN_LISTS } from '@/store/settingsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'
import { DUST_THRESHOLD } from '@/config/constants'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics'
import css from './ManageTokensMenu.module.css'

interface ManageTokensMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  onHideTokens?: () => void
}

const menuItemHoverSx = {
  '&:hover': {
    backgroundColor: ({ palette }: Theme) => palette.background.lightGrey,
  },
}

const ManageTokensMenu = ({ anchorEl, open, onClose, onHideTokens }: ManageTokensMenuProps): ReactElement => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const shouldUsePortfolioEndpoint = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const hiddenTokens = useHiddenTokens()

  const showAllTokens = settings.tokenList === TOKEN_LISTS.ALL || settings.tokenList === undefined
  const hideDust = settings.hideDust ?? true
  const hiddenTokensCount = hiddenTokens.length

  const handleToggleShowAllTokens = () => {
    const newTokenList = showAllTokens ? TOKEN_LISTS.TRUSTED : TOKEN_LISTS.ALL
    dispatch(setTokenList(newTokenList))
  }

  const handleToggleHideDust = () => {
    dispatch(setHideDust(!hideDust))
  }

  const handleHideTokens = () => {
    onClose()
    if (onHideTokens) {
      onHideTokens()
    }
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        className: css.menu,
      }}
    >
      {hasDefaultTokenlist && (
        <MenuItem onClick={handleToggleShowAllTokens} className={css.menuItem} sx={menuItemHoverSx}>
          <Box className={css.menuItemContent}>
            <Box className={css.menuItemLeft}>
              <Typography variant="body2">Show all tokens</Typography>
              <InfoTooltip
                title={
                  <Typography>
                    Learn more about <ExternalLink href={HelpCenterArticle.SPAM_TOKENS}>default tokens</ExternalLink>
                  </Typography>
                }
              />
            </Box>
            <Track {...(showAllTokens ? ASSETS_EVENTS.SHOW_ALL_TOKENS : ASSETS_EVENTS.SHOW_DEFAULT_TOKENS)}>
              <Switch size="small" checked={showAllTokens} onChange={handleToggleShowAllTokens} />
            </Track>
          </Box>
        </MenuItem>
      )}

      {shouldUsePortfolioEndpoint && (
        <MenuItem className={css.menuItem} sx={menuItemHoverSx} onClick={handleToggleHideDust}>
          <Box className={css.menuItemContent}>
            <Box className={css.menuItemLeft}>
              <Typography variant="body2">Hide small balances</Typography>
              <InfoTooltip title={<Typography>Hide tokens with a value less than ${DUST_THRESHOLD}</Typography>} />
            </Box>
            <Switch size="small" checked={hideDust} onChange={handleToggleHideDust} />
          </Box>
        </MenuItem>
      )}

      {(hasDefaultTokenlist || shouldUsePortfolioEndpoint) && <Divider />}

      <MenuItem onClick={handleHideTokens} className={css.menuItem} sx={menuItemHoverSx}>
        <Track {...ASSETS_EVENTS.SHOW_HIDDEN_ASSETS}>
          <Typography variant="body2">Hide tokens{hiddenTokensCount > 0 && ` (${hiddenTokensCount})`}</Typography>
        </Track>
      </MenuItem>
    </Menu>
  )
}

export default ManageTokensMenu
