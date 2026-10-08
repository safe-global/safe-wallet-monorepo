import ExternalLink from '@/components/common/ExternalLink'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import SettingsCard from '@/components/settings/SettingsCard'

export type SafeAppsSigningMethodViewProps = {
  brandName: string
  onChainSigning: boolean
  onChange: () => void
}

export const SafeAppsSigningMethodView = ({ brandName, onChainSigning, onChange }: SafeAppsSigningMethodViewProps) => {
  return (
    <SettingsCard title="Signing method" titleClassName="mb-2" className="mt-4">
      <Typography className="mb-4">
        This setting determines how the {brandName} will sign message requests from Safe Apps. Gasless, off-chain
        signing is used by default. Learn more about message signing{' '}
        <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.SIGNED_MESSAGES}>
          here
        </ExternalLink>
        .
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
    </SettingsCard>
  )
}
