import ThemeOptions from '@/components/settings/ThemeOptions'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

const AppearanceSection = () => (
  <SpaceSettingsSection>
    <SpaceSettingsSectionTitle>Appearance</SpaceSettingsSectionTitle>
    <ThemeOptions />
  </SpaceSettingsSection>
)

export default AppearanceSection
