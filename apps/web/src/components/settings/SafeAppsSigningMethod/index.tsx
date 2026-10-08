import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOnChainSigning, setOnChainSigning } from '@/store/settingsSlice'
import { BRAND_NAME } from '@/config/constants'
import { SafeAppsSigningMethodView } from '@views/components/settings/SafeAppsSigningMethod/SafeAppsSigningMethodView'

export const SafeAppsSigningMethod = () => {
  const onChainSigning = useAppSelector(selectOnChainSigning)

  const dispatch = useAppDispatch()

  const onChange = () => {
    trackEvent(SETTINGS_EVENTS.SAFE_APPS.CHANGE_SIGNING_METHOD)
    dispatch(setOnChainSigning(!onChainSigning))
  }

  return <SafeAppsSigningMethodView brandName={BRAND_NAME} onChainSigning={onChainSigning} onChange={onChange} />
}
