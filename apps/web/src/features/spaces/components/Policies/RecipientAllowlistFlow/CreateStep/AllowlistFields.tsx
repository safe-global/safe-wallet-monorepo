import type { ReactElement } from 'react'
import { Plus, X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import AddressBookInput from '@/components/common/AddressBookInput'
import { POLICY_DEFAULT_FALLBACK } from '@/config/constants'
import TokenSelector from '../../SpendingLimitFlow/TokenSelector'
import {
  ADD_RECIPIENT_LABEL,
  ADD_TOKEN_LABEL,
  DUPLICATE_RECIPIENT_ERROR,
  NATIVE_TOKEN_UNRESTRICTED_REASON,
  RECIPIENTS_HELPER_TEXT,
  RECIPIENTS_LABEL,
  RECIPIENT_LABEL,
  RECIPIENT_PLACEHOLDER,
  REMOVE_RECIPIENT_LABEL,
  REMOVE_TOKEN_LABEL,
  TOKENS_HELPER_TEXT,
  TOKENS_LABEL,
  TOKEN_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFormValues } from '../types'

// A value transfer to an unlisted recipient falls through to the fallback, which only a deny default blocks
const NATIVE_TOKEN_ADDRESSES = POLICY_DEFAULT_FALLBACK === 'deny' ? undefined : [ZERO_ADDRESS]

const Section = ({ label, helper, children }: { label: string; helper: string; children: ReactElement }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="paragraph-bold">{label}</Typography>
    <Typography variant="paragraph-mini" color="muted" className="mb-2">
      {helper}
    </Typography>
    {children}
  </div>
)

/** The allowlist's own fields: the tokens it covers, then who may receive them. */
const AllowlistFields = (): ReactElement => {
  const { control, watch, setValue, trigger } = useFormContext<RecipientAllowlistFormValues>()
  const tokens = useFieldArray({ control, name: 'tokens' })
  const recipients = useFieldArray({ control, name: 'recipients' })

  const tokenValues = watch('tokens')
  const recipientValues = watch('recipients')
  const pickedTokens = tokenValues.map((row) => row.address).filter(Boolean)

  return (
    <>
      <Section label={TOKENS_LABEL} helper={TOKENS_HELPER_TEXT}>
        <div className="flex flex-col gap-3">
          {tokens.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grow">
                <TokenSelector
                  value={tokenValues[index]?.address || undefined}
                  excludeAddresses={pickedTokens.filter((address) => address !== tokenValues[index]?.address)}
                  disabledAddresses={NATIVE_TOKEN_ADDRESSES}
                  disabledAddressReason={NATIVE_TOKEN_UNRESTRICTED_REASON}
                  onChange={(address) => {
                    setValue(`tokens.${index}.address`, address ?? '', { shouldValidate: true, shouldDirty: true })
                    void trigger('tokens')
                  }}
                  label={TOKEN_LABEL}
                  data-testid={`allowlist-token-${index}`}
                />
              </div>
              {tokens.fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={REMOVE_TOKEN_LABEL}
                  onClick={() => tokens.remove(index)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => tokens.append({ address: '' })}
            data-testid="add-token-btn"
          >
            <Plus className="size-4" aria-hidden />
            {ADD_TOKEN_LABEL}
          </Button>
        </div>
      </Section>

      <Section label={RECIPIENTS_LABEL} helper={RECIPIENTS_HELPER_TEXT}>
        <div className="flex flex-col gap-3">
          {recipients.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grow">
                <AddressBookInput
                  name={`recipients.${index}.address`}
                  label={RECIPIENT_LABEL}
                  placeholder={RECIPIENT_PLACEHOLDER}
                  required
                  focused={false}
                  validate={(value: string) => {
                    const others = recipientValues
                      .filter((_, other) => other !== index)
                      .map((row) => row.address.toLowerCase())
                    return others.includes(value.toLowerCase()) ? DUPLICATE_RECIPIENT_ERROR : undefined
                  }}
                />
              </div>
              {recipients.fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={REMOVE_RECIPIENT_LABEL}
                  onClick={() => recipients.remove(index)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => recipients.append({ address: '' })}
            data-testid="add-recipient-btn"
          >
            <Plus className="size-4" aria-hidden />
            {ADD_RECIPIENT_LABEL}
          </Button>
        </div>
      </Section>
    </>
  )
}

export default AllowlistFields
