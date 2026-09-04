import { type ReactElement, useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import EthHashInfo from '@/components/common/EthHashInfo'
import CheckWallet from '@/components/common/CheckWallet'
import SettingsCard from '@/components/settings/SettingsCard'
import { TxModalContext } from '@/components/tx-flow'
import { ManageSignersFlow } from '@/components/tx-flow/flows'
import useSafeInfo from '@/hooks/useSafeInfo'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useCloudCosignerSafeStatus } from '../../hooks/useCloudCosignerSafeStatus'
import { useSignPolicyUpdate } from '../../hooks/useSignPolicyUpdate'
import { useUpdateCloudCosignerPolicyMutation } from '../../store/cloudCosignerApi'
import type { CloudCosignerPolicy } from '../../types'
import { CLOUD_COSIGNER_DESCRIPTION, CLOUD_COSIGNER_NAME, POLICY_INSTRUCTIONS_MAX_LENGTH } from '../../constants'

const SETTINGS_CARD_ID = 'cloud-cosigner-section'

/**
 * Settings card: shows whether the cosigner signs for this Safe and lets an owner edit the
 * policy. Saving signs the policy with the connected wallet, since the cosigner service
 * authenticates policy updates by owner signature rather than by session.
 */
const CloudCosignerSettings = (): ReactElement | null => {
  const { isAvailable, status, isLoading, error } = useCloudCosignerSafeStatus()

  if (!isAvailable) {
    return null
  }

  return (
    <SettingsCard title={CLOUD_COSIGNER_NAME} data-testid={SETTINGS_CARD_ID} className="mb-4">
      <Typography className="mb-4">{CLOUD_COSIGNER_DESCRIPTION}</Typography>

      {isLoading && <Skeleton data-testid="cloud-cosigner-settings-loading" className="h-24 w-full" />}

      {!isLoading && (error || !status) && (
        <Alert variant="warning">
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>The cloud cosigner service could not be reached.</AlertDescription>
        </Alert>
      )}

      {!isLoading && status && (status.isEnabled ? <PolicyForm status={status} /> : <NotEnabled />)}
    </SettingsCard>
  )
}

const NotEnabled = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <div data-testid="cloud-cosigner-not-enabled" className="flex flex-col items-start gap-4">
      <Typography>
        The cloud cosigner is not a signer of this Safe account yet. Add it as a signer and raise the threshold by one
        to enable it.
      </Typography>
      <CheckWallet>
        {(isOk) => (
          <Button
            data-testid="cloud-cosigner-manage-signers"
            disabled={!isOk}
            onClick={() => setTxFlow(<ManageSignersFlow />)}
          >
            Manage signers
          </Button>
        )}
      </CheckWallet>
    </div>
  )
}

const PolicyForm = ({
  status,
}: {
  status: NonNullable<ReturnType<typeof useCloudCosignerSafeStatus>['status']>
}): ReactElement => {
  const { safe, safeAddress } = useSafeInfo()
  const signPolicy = useSignPolicyUpdate()
  const [updatePolicy, { isLoading: isSaving }] = useUpdateCloudCosignerPolicyMutation()
  const [policy, setPolicy] = useState<CloudCosignerPolicy>(status.policy)
  const [saveError, setSaveError] = useState<string>()
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setPolicy(status.policy)
  }, [status.policy])

  const isDirty =
    policy.valueThresholdUsd !== status.policy.valueThresholdUsd ||
    policy.reviewUnknownContracts !== status.policy.reviewUnknownContracts ||
    (policy.instructions ?? '') !== (status.policy.instructions ?? '')
  const isThresholdValid = Number.isInteger(policy.valueThresholdUsd) && policy.valueThresholdUsd >= 0

  const onSave = async (): Promise<void> => {
    setSaveError(undefined)
    setIsSaved(false)
    try {
      const { signature, issuedAt, signer } = await signPolicy({ chainId: safe.chainId, safeAddress, policy })
      await updatePolicy({ chainId: safe.chainId, safeAddress, policy, signer, signature, issuedAt }).unwrap()
      setIsSaved(true)
    } catch (e) {
      setSaveError(asError(e).message)
    }
  }

  return (
    <div data-testid="cloud-cosigner-policy-form" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-small" className="text-muted-foreground">
          Signer address
        </Typography>
        <EthHashInfo
          address={status.cosignerAddress}
          name={CLOUD_COSIGNER_NAME}
          shortAddress={false}
          showCopyButton
          hasExplorer
        />
      </div>

      {status.isDefaultPolicy && !isDirty && (
        <Alert variant="info">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>
            This Safe account uses the default policy. Adjust and save to set your own rules.
          </AlertDescription>
        </Alert>
      )}

      <Field>
        <FieldLabel htmlFor="cloud-cosigner-threshold">Review transactions above (USD)</FieldLabel>
        <Input
          id="cloud-cosigner-threshold"
          data-testid="cloud-cosigner-threshold"
          type="number"
          min={0}
          step={1}
          value={Number.isNaN(policy.valueThresholdUsd) ? '' : policy.valueThresholdUsd}
          onChange={(event) => setPolicy({ ...policy, valueThresholdUsd: Number.parseInt(event.target.value, 10) })}
        />
        <FieldDescription>
          Transactions moving or approving less than this are signed right away. Anything above, or of unknown value,
          gets a full review.
        </FieldDescription>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="cloud-cosigner-unknown-contracts"
          data-testid="cloud-cosigner-unknown-contracts"
          checked={policy.reviewUnknownContracts}
          onCheckedChange={(value) => setPolicy({ ...policy, reviewUnknownContracts: value === true })}
        />
        <FieldContent>
          <FieldLabel htmlFor="cloud-cosigner-unknown-contracts">Review first interactions with new apps</FieldLabel>
          <FieldDescription>
            A transaction calling a contract this Safe account has never executed a transaction against gets a full
            review.
          </FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="cloud-cosigner-instructions">Additional instructions</FieldLabel>
        <Textarea
          id="cloud-cosigner-instructions"
          data-testid="cloud-cosigner-instructions"
          rows={4}
          maxLength={POLICY_INSTRUCTIONS_MAX_LENGTH}
          placeholder="e.g. Only approve payments to our listed vendors. Never approve unlimited token allowances."
          value={policy.instructions ?? ''}
          onChange={(event) => setPolicy({ ...policy, instructions: event.target.value || null })}
        />
        <FieldDescription>Plain-language rules the cosigner follows when it reviews a transaction.</FieldDescription>
      </Field>

      {saveError && (
        <Alert variant="destructive" data-testid="cloud-cosigner-save-error">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {isSaved && !isDirty && (
        <Alert variant="success" data-testid="cloud-cosigner-saved">
          <AlertSeverityIcon variant="success" />
          <AlertDescription>Policy saved.</AlertDescription>
        </Alert>
      )}

      <div>
        <CheckWallet allowProposer={false}>
          {(isOk) => (
            <Button
              data-testid="cloud-cosigner-save"
              onClick={onSave}
              disabled={!isOk || !isDirty || !isThresholdValid || isSaving}
            >
              {isSaving ? 'Signing…' : 'Sign and save policy'}
            </Button>
          )}
        </CheckWallet>
      </div>
    </div>
  )
}

export default CloudCosignerSettings
