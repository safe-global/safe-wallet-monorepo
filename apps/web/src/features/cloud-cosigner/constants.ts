import { CLOUD_COSIGNER_URL } from '@/config/constants'

export { CLOUD_COSIGNER_URL }

/** Address-book name given to the cosigner owner, and the label shown next to it. */
export const CLOUD_COSIGNER_NAME = 'Cloud cosigner'

export const CLOUD_COSIGNER_DESCRIPTION =
  'An automated signer that reviews every proposed transaction against your policy before adding its confirmation. It counts as one extra required signature.'

/** Upper bound on the free-text instructions, mirrored from the cosigner service. */
export const POLICY_INSTRUCTIONS_MAX_LENGTH = 4000
