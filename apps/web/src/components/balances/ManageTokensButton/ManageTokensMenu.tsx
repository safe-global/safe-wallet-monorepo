import { type ReactElement } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTokenList, setHideDust, TOKEN_LISTS } from '@/store/settingsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DUST_THRESHOLD } from '@/config/constants'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ManageTokensMenuView } from '@views/components/balances/ManageTokensButton/ManageTokensMenuView'

interface ManageTokensMenuProps {
  onClose: () => void
  onHideTokens?: () => void
  /** Takes precedence over useHasFeature(FEATURES.DEFAULT_TOKENLIST) when provided */
  _hasDefaultTokenlist?: boolean
}

const ManageTokensMenu = ({ onClose, onHideTokens, _hasDefaultTokenlist }: ManageTokensMenuProps): ReactElement => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const hasDefaultTokenlistFromHook = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hiddenTokens = useHiddenTokens()
  const { safe } = useSafeInfo()

  const hasDefaultTokenlist = _hasDefaultTokenlist ?? hasDefaultTokenlistFromHook

  const showAllTokens = settings.tokenList === TOKEN_LISTS.ALL || settings.tokenList === undefined
  const hideDust = settings.hideDust ?? true
  const hiddenTokensCount = hiddenTokens.length

  const handleToggleShowAllTokens = (checked: boolean) => {
    dispatch(setTokenList(checked ? TOKEN_LISTS.ALL : TOKEN_LISTS.TRUSTED))
  }

  const handleToggleHideDust = (checked: boolean) => {
    dispatch(setHideDust(checked))
  }

  const handleHideTokens = () => {
    onClose()
    onHideTokens?.()
  }

  return (
    <ManageTokensMenuView
      hasDefaultTokenlist={!!hasDefaultTokenlist}
      showAllTokens={showAllTokens}
      hideDust={hideDust}
      isSafeDeployed={safe.deployed}
      hiddenTokensCount={hiddenTokensCount}
      dustThreshold={DUST_THRESHOLD}
      onToggleShowAllTokens={handleToggleShowAllTokens}
      onToggleHideDust={handleToggleHideDust}
      onHideTokens={handleHideTokens}
    />
  )
}

export default ManageTokensMenu
