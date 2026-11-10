import type { WhatsNewThumbnailVariant } from '@safe-global/views/features/spaces/components/WhatsNewThumbnail'

const CATEGORY_THUMBNAILS: Record<string, WhatsNewThumbnailVariant> = {
  new: 'announcement',
  announcement: 'announcement',
  improvement: 'safeStandard',
  fix: 'security',
  'coming soon': 'networks',
  'safe pro': 'safePro',
  safenet: 'safenet',
  'safe shield': 'safeShield',
  security: 'security',
  multisig: 'multisig',
  institutions: 'institutions',
  networks: 'networks',
  earn: 'coins',
  staking: 'coins',
  swap: 'swap',
  bridge: 'swap',
  developers: 'code',
  api: 'code',
  recovery: 'key',
  passkeys: 'fingerprint',
  platform: 'layers',
}

export const DEFAULT_CORNER_CARD_THUMBNAIL: WhatsNewThumbnailVariant = 'safe'

export const getCornerCardThumbnail = (category?: string): WhatsNewThumbnailVariant => {
  const match = category
    ?.split(/[,;]/)
    .map((name) => CATEGORY_THUMBNAILS[name.trim().toLowerCase()])
    .find(Boolean)

  return match ?? DEFAULT_CORNER_CARD_THUMBNAIL
}
