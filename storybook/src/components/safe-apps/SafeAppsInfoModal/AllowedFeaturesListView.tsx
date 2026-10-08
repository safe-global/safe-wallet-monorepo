import type { ReactElement } from 'react'
import ShieldIcon from '@/public/images/settings/permissions/shield.svg'
import { Typography } from '@/components/ui/typography'
import PermissionsCheckbox from '@views/components/safe-apps/PermissionCheckbox'
import type { AllowedFeatures } from '@views/components/safe-apps/types'

export type AllowedFeaturesListViewProps = {
  features: { feature: AllowedFeatures; checked: boolean; label: string }[]
  onFeatureSelectionChange: (feature: AllowedFeatures, checked: boolean) => void
}

export function AllowedFeaturesListView({
  features,
  onFeatureSelectionChange,
}: AllowedFeaturesListViewProps): ReactElement {
  return (
    <>
      <ShieldIcon className="mx-auto mb-2 size-6 text-[var(--color-primary-main)]" />

      <Typography variant="paragraph-small" className="text-center text-[var(--color-text-secondary)]">
        Manage the features Safe Apps can use
      </Typography>

      <div className="mx-2 my-6 text-left">
        <Typography>This Safe App is requesting permission to use:</Typography>

        <div className="m-4 flex flex-col gap-4">
          {features.map(({ feature, checked, label }, index) => (
            <PermissionsCheckbox
              key={index}
              name="checkbox"
              checked={checked}
              onChange={(_, checked) => onFeatureSelectionChange(feature, checked)}
              label={label}
            />
          ))}
        </div>
      </div>
    </>
  )
}
