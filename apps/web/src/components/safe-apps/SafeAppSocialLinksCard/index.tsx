import { SafeAppSocialPlatforms } from '@safe-global/store/gateway/types'
import type { SafeApp as SafeAppData, SafeAppSocialProfile } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { SafeAppSocialLinksCardView } from '@views/components/safe-apps/SafeAppSocialLinksCard/SafeAppSocialLinksCardView'

type SafeAppSocialLinksCardProps = {
  safeApp: SafeAppData
}

const SafeAppSocialLinksCard = ({ safeApp }: SafeAppSocialLinksCardProps) => {
  const { socialProfiles, developerWebsite } = safeApp

  const hasSocialLinks = socialProfiles?.length > 0

  if (!hasSocialLinks && !developerWebsite) {
    return null
  }

  const discordSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.DISCORD)
  const twitterSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.TWITTER)
  const githubSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.GITHUB)
  const telegramSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.TELEGRAM)

  return (
    <SafeAppSocialLinksCardView
      hasSocialLinks={hasSocialLinks}
      developerWebsite={developerWebsite}
      discordSocialLink={discordSocialLink}
      twitterSocialLink={twitterSocialLink}
      githubSocialLink={githubSocialLink}
      telegramSocialLink={telegramSocialLink}
    />
  )
}

export default SafeAppSocialLinksCard

const getSocialProfile = (socialProfiles: SafeAppSocialProfile[], platform: SafeAppSocialPlatforms) => {
  const socialLink = socialProfiles.find((socialProfile) => socialProfile.platform === platform)

  return socialLink
}
