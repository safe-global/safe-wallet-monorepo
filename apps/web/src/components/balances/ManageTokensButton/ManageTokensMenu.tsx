import { type ReactElement } from 'react'
import { Menu, MenuItem, Box, Typography, Switch, Divider } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTokenList, setHideDust, TOKEN_LISTS } from '@/store/settingsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { DUST_THRESHOLD } from '@/config/constants'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics'
import useSafeInfo from '@/hooks/useSafeInfo'
import css from './ManageTokensMenu.module.css'

interface ManageTokensMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  onHideTokens?: () => void
  /** Takes precedence over useHasFeature(FEATURES.DEFAULT_TOKENLIST) when provided */
  _hasDefaultTokenlist?: boolean
}

const menuItemHoverSx = { '&:hover': { backgroundColor: ({ palette }: Theme) => palette.background.lightGrey } }

const ManageTokensMenu = ({
  anchorEl,
  open,
  onClose,
  onHideTokens,
  _hasDefaultTokenlist,
}: ManageTokensMenuProps): ReactElement => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const hasDefaultTokenlistFromHook = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hiddenTokens = useHiddenTokens()
  const { safe } = useSafeInfo()

  const hasDefaultTokenlist = _hasDefaultTokenlist ?? hasDefaultTokenlistFromHook

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
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{ className: css.menu }}
      data-testid="manage-tokens-menu"
    >
      {hasDefaultTokenlist && (
        <MenuItem
          onClick={handleToggleShowAllTokens}
          className={css.menuItem}
          sx={menuItemHoverSx}
          data-testid="show-all-tokens-menu-item"
        >
          <Box className={css.menuItemContent}>
            <Box className={css.menuItemLeft}>
              <Typography variant="body2" fontWeight="bold">
                Show all tokens
              </Typography>
              <InfoTooltip
                title={
                  <Typography>
                    Learn more about <ExternalLink href={HelpCenterArticle.SPAM_TOKENS}>default tokens</ExternalLink>
                  </Typography>
                }
                data-testid="show-all-tokens-info-tooltip"
              />
            </Box>
            <Track {...(showAllTokens ? ASSETS_EVENTS.SHOW_ALL_TOKENS : ASSETS_EVENTS.SHOW_DEFAULT_TOKENS)}>
              <Switch
                checked={showAllTokens}
                onClick={(e) => e.stopPropagation()}
                onChange={handleToggleShowAllTokens}
                data-testid="show-all-tokens-switch"
              />
            </Track>
          </Box>
        </MenuItem>
      )}

      {safe.deployed && (
        <MenuItem
          className={css.menuItem}
          sx={menuItemHoverSx}
          onClick={handleToggleHideDust}
          data-testid="hide-small-balances-menu-item"
        >
          <Box className={css.menuItemContent}>
            <Box className={css.menuItemLeft}>
              <Typography variant="body2" fontWeight="bold">
                Hide small balances
              </Typography>
              <InfoTooltip
                title={<Typography>Hide tokens with a value less than ${DUST_THRESHOLD}</Typography>}
                data-testid="hide-small-balances-info-tooltip"
              />
            </Box>
            <Switch
              checked={hideDust}
              onClick={(e) => e.stopPropagation()}
              onChange={handleToggleHideDust}
              data-testid="hide-small-balances-switch"
            />
          </Box>
        </MenuItem>
      )}

      <Divider data-testid="manage-tokens-menu-divider" />

      <MenuItem
        onClick={handleHideTokens}
        className={css.menuItem}
        sx={menuItemHoverSx}
        data-testid="hide-tokens-menu-item"
      >
        <Track {...ASSETS_EVENTS.SHOW_HIDDEN_ASSETS}>
          <Typography variant="body2" fontWeight="bold">
            Hide tokens{hiddenTokensCount > 0 && ` (${hiddenTokensCount})`}
          </Typography>
        </Track>
      </MenuItem>
    </Menu>
  )
}

export default ManageTokensMenu
