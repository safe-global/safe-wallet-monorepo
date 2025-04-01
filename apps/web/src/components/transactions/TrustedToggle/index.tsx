import { useHasFeature } from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, hideSuspiciousTransactions } from '@/store/settingsSlice'
import madProps from '@/utils/mad-props'
import _TrustedToggleButton from './TrustedToggleButton'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useOnlyTrusted = () => {
  const userSettings = useAppSelector(selectSettings)
  return userSettings.hideSuspiciousTransactions || false
}

const useHasDefaultTokenList = () => {
  return useHasFeature(FEATURES.DEFAULT_TOKENLIST)
}

const useSetOnlyTrusted = () => {
  const dispatch = useAppDispatch()
  return (isOn: boolean) => {
    dispatch(hideSuspiciousTransactions(isOn))
  }
}

const TrustedToggle = madProps(_TrustedToggleButton, {
  onlyTrusted: useOnlyTrusted,
  setOnlyTrusted: useSetOnlyTrusted,
  hasDefaultTokenlist: useHasDefaultTokenList,
})

export default TrustedToggle
