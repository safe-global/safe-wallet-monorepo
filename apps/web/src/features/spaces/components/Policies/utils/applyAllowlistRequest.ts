import { AbiCoder } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { PolicyConfigurationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  AllowlistEntry,
  AllowlistPolicyData,
  AllowlistRecipient,
  PolicyTokenInfo,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import { markAllowlistChanges } from '../RecipientAllowlistFlow/utils/allowlistEdit'

export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
export const NATIVE_TRANSFER_SELECTOR = '0x00000000'
const PERMISSION_NONE = 0
const PERMISSIONS: Record<number, AllowlistRecipient['permission']> = { 1: 'ONCE', 2: 'ALWAYS' }

/** The recipients a token rule allows and the ones it revokes; none for data that is not a recipient list. */
export const decodeRecipients = (data: string): { recipients: AllowlistRecipient[]; revoked: string[] } => {
  let entries: Array<[string, bigint]>
  try {
    entries = AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], data)[0]
  } catch {
    return { recipients: [], revoked: [] }
  }

  return {
    recipients: entries
      .filter(([, permission]) => Number(permission) !== PERMISSION_NONE)
      .map(([account, permission]) => ({ account, permission: PERMISSIONS[Number(permission)] ?? 'ALWAYS' })),
    revoked: entries.filter(([, permission]) => Number(permission) === PERMISSION_NONE).map(([account]) => account),
  }
}

const tokensOf = ({ entries }: AllowlistPolicyData): PolicyTokenInfo[] => entries.map(({ token }) => token)

/** The live allowlist as it will be once the request applies, with each recipient and token marked against it. */
export const applyAllowlistRequest = (
  live: AllowlistPolicyData,
  configurations: readonly PolicyConfigurationDto[],
  resolveToken: (address: string) => PolicyTokenInfo,
): AllowlistPolicyData => {
  let entries: AllowlistEntry[] = live.entries.map(({ token, recipients }) => ({ token, recipients: [...recipients] }))

  const entryFor = (tokenAddress: string): AllowlistEntry => {
    const existing = entries.find(({ token }) => sameAddress(token.address, tokenAddress))
    if (existing) return existing
    const entry = { token: resolveToken(tokenAddress), recipients: [] }
    entries.push(entry)
    return entry
  }
  const allow = (tokenAddress: string, recipients: AllowlistRecipient[]) => {
    const entry = entryFor(tokenAddress)
    for (const recipient of recipients) {
      const index = entry.recipients.findIndex(({ account }) => sameAddress(account, recipient.account))
      if (index === -1) entry.recipients.push(recipient)
      else entry.recipients[index] = recipient
    }
  }
  const revoke = (tokenAddress: string, accounts: string[]) => {
    const entry = entries.find(({ token }) => sameAddress(token.address, tokenAddress))
    if (!entry) return
    entry.recipients = entry.recipients.filter(
      ({ account }) => !accounts.some((revoked) => sameAddress(revoked, account)),
    )
  }

  for (const { target, selector, policy, data } of configurations) {
    const isUnbind = sameAddress(policy, ZERO_ADDRESS)
    if (selector === ERC20_TRANSFER_SELECTOR) {
      if (isUnbind) {
        entries = entries.filter(({ token }) => !sameAddress(token.address, target))
        continue
      }
      const { recipients, revoked } = decodeRecipients(data)
      if (recipients.length > 0) allow(target, recipients)
      revoke(target, revoked)
    } else if (selector === NATIVE_TRANSFER_SELECTOR && !sameAddress(target, ZERO_ADDRESS)) {
      if (isUnbind) revoke(ZERO_ADDRESS, [target])
      else allow(ZERO_ADDRESS, [{ account: target, permission: 'ALWAYS' }])
    }
  }

  const result = { entries: entries.filter(({ recipients }) => recipients.length > 0) }
  const asItems = (data: AllowlistPolicyData) => getAllowlistRecipients(data).map((address) => ({ address }))

  return {
    ...result,
    changes: {
      recipients: markAllowlistChanges(asItems(result), asItems(live), ({ address }) => address.toLowerCase()),
      tokens: markAllowlistChanges(tokensOf(result), tokensOf(live), ({ address }) => address.toLowerCase()),
    },
  }
}
