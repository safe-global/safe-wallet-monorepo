import ExternalLink from '@/components/common/ExternalLink'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOnChainSigning, setOnChainSigning } from '@/store/settingsSlice'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import { BRAND_NAME } from '@/config/constants'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export const SafeAppsSigningMethod = () => {
  const onChainSigning = useAppSelector(selectOnChainSigning)

  const dispatch = useAppDispatch()

  const onChange = () => {
    trackEvent(SETTINGS_EVENTS.SAFE_APPS.CHANGE_SIGNING_METHOD)
    dispatch(setOnChainSigning(!onChainSigning))
  }

  return (
    <div className="mt-4 rounded-lg bg-[var(--color-background-paper)] p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <Typography variant="h4" className="mb-2">
            Signing method
          </Typography>
        </div>

        <div>
          <Typography className="mb-4">
            This setting determines how the {BRAND_NAME} will sign message requests from Safe Apps. Gasless, off-chain
            signing is used by default. Learn more about message signing{' '}
            <ExternalLink href={HelpCenterArticle.SIGNED_MESSAGES}>here</ExternalLink>.
          </Typography>
          <Field orientation="horizontal" className="w-fit">
            <Checkbox
              id="use-on-chain-signing"
              name="use-on-chain-signing"
              checked={onChainSigning}
              onCheckedChange={onChange}
            />
            <FieldLabel htmlFor="use-on-chain-signing">Always use on-chain signatures</FieldLabel>
          </Field>
        </div>
      </div>
    </div>
  )
}
