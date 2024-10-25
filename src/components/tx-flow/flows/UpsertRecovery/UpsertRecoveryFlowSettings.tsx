import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import {
  Divider,
  CardActions,
  Button,
  Typography,
  SvgIcon,
  MenuItem,
  TextField,
  Collapse,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Alert,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { useState } from 'react'
import type { TextFieldProps } from '@mui/material'
import type { ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import { UpsertRecoveryFlowFields } from '.'
import { useRecoveryPeriods } from './useRecoveryPeriods'
import AddressBookInput from '@/components/common/AddressBookInput'
import { sameAddress } from '@/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { RecovererWarning } from './RecovererSmartContractWarning'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@/config/constants'
import { TOOLTIP_TITLES } from '../../common/constants'
import Track from '@/components/common/Track'
import type { UpsertRecoveryFlowProps } from '.'
import type { RecoveryStateItem } from '@/features/recovery/services/recovery-state'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import css from './styles.module.css'

export function UpsertRecoveryFlowSettings({
  params,
  delayModifier,
  onSubmit,
}: {
  params: UpsertRecoveryFlowProps
  delayModifier?: RecoveryStateItem
  onSubmit: (formData: UpsertRecoveryFlowProps) => void
}): ReactElement {
  const { safeAddress } = useSafeInfo()
  const [showAdvanced, setShowAdvanced] = useState(params[UpsertRecoveryFlowFields.expiry] !== '0')
  const [understandsRisk, setUnderstandsRisk] = useState(false)
  const periods = useRecoveryPeriods()

  const formMethods = useForm<UpsertRecoveryFlowProps>({
    defaultValues: params,
    mode: 'onChange',
  })

  const recoverer = formMethods.watch(UpsertRecoveryFlowFields.recoverer)
  const delay = formMethods.watch(UpsertRecoveryFlowFields.delay)
  const expiry = formMethods.watch(UpsertRecoveryFlowFields.expiry)

  // RHF's dirty check is tempermental with our address input dropdown
  const isDirty = delayModifier
    ? // Updating settings
      !sameAddress(recoverer, delayModifier.recoverers[0]) ||
      delayModifier.delay !== BigInt(delay) ||
      delayModifier.expiry !== BigInt(expiry)
    : // Setting up recovery
      recoverer && delay && expiry

  const validateRecoverer = (recoverer: string) => {
    if (sameAddress(recoverer, safeAddress)) {
      return 'The Safe Account cannot be a Recoverer of itself'
    }
  }

  const onShowAdvanced = () => {
    setShowAdvanced((prev) => !prev)
    trackEvent(RECOVERY_EVENTS.SHOW_ADVANCED)
  }

  const isDisabled = !understandsRisk || !isDirty

  return (
    <>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className={commonCss.form}>
          <TxCard>
            <Alert severity="warning" sx={{ border: 'unset' }}>
              Your Recoverer will be able to reset your Account setup. Only select an address that you trust.{' '}
              <Track {...RECOVERY_EVENTS.LEARN_MORE} label="recover-setup-flow">
                <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
                  Learn more
                </ExternalLink>
              </Track>
            </Alert>

            <div>
              <Typography variant="h5" gutterBottom>
                Trusted Recoverer
              </Typography>

              <Typography variant="body2">
                Choose a Recoverer, such as a hardware wallet or a Safe Account controlled by family or friends, that
                can initiate the recovery process in the future.
              </Typography>
            </div>

            <div>
              <AddressBookInput
                label="Recoverer address or ENS"
                name={UpsertRecoveryFlowFields.recoverer}
                required
                fullWidth
                validate={validateRecoverer}
              />
              <RecovererWarning />
            </div>
            <div>
              <Typography variant="h5" gutterBottom>
                Review window
                <Tooltip placement="top" arrow title={TOOLTIP_TITLES.REVIEW_WINDOW}>
                  <span>
                    <SvgIcon
                      component={InfoIcon}
                      inheritViewBox
                      fontSize="small"
                      color="border"
                      sx={{ verticalAlign: 'middle', ml: 0.5 }}
                    />
                  </span>
                </Tooltip>
              </Typography>

              <Typography variant="body2">
                You can cancel any recovery proposal when it is not needed or wanted during this period.
              </Typography>
            </div>

            <Controller
              control={formMethods.control}
              name={UpsertRecoveryFlowFields.delay}
              render={({ field: { ref, ...field } }) => (
                <SelectField
                  data-testid="recovery-delay-select"
                  label="Recovery delay"
                  fullWidth
                  inputRef={ref}
                  {...field}
                >
                  {periods.delay.map(({ label, value }, index) => (
                    <MenuItem key={index} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </SelectField>
              )}
            />

            <Typography variant="body2" onClick={onShowAdvanced} role="button" className={css.advanced}>
              Advanced {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Typography>

            <Collapse in={showAdvanced}>
              <div>
                <Typography variant="h5" gutterBottom>
                  Proposal expiry
                  <Tooltip placement="top" arrow title={TOOLTIP_TITLES.PROPOSAL_EXPIRY}>
                    <span>
                      <SvgIcon
                        component={InfoIcon}
                        inheritViewBox
                        fontSize="small"
                        color="border"
                        sx={{ verticalAlign: 'middle', ml: 0.5 }}
                      />
                    </span>
                  </Tooltip>
                </Typography>

                <Typography variant="body2" mb={2}>
                  Set a period of time after which the recovery proposal will expire and can no longer be executed.
                </Typography>
              </div>

              <Controller
                control={formMethods.control}
                name={UpsertRecoveryFlowFields.expiry}
                // Don't reset value if advanced section is collapsed
                shouldUnregister={false}
                render={({ field: { ref, ...field } }) => (
                  <SelectField label="Proposal expiry" fullWidth inputRef={ref} {...field}>
                    {periods.expiration.map(({ label, value }, index) => (
                      <MenuItem key={index} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </SelectField>
                )}
              />
            </Collapse>
          </TxCard>

          <TxCard>
            <FormControlLabel
              data-testid="warning-section"
              label="I understand that the Recoverer will be able to initiate recovery of this Safe Account and that I will only be informed within the Super Account."
              control={<Checkbox checked={understandsRisk} onChange={(_, checked) => setUnderstandsRisk(checked)} />}
              sx={{ pl: 2 }}
            />

            <Divider className={commonCss.nestedDivider} />

            <CardActions sx={{ mt: '0 !important' }}>
              <Button data-testid="next-btn" variant="contained" type="submit" disabled={isDisabled}>
                Next
              </Button>
            </CardActions>
          </TxCard>
        </form>
      </FormProvider>
    </>
  )
}

function SelectField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      select
      sx={{
        '& .MuiSelect-select': {
          textAlign: 'right',
          fontWeight: 700,
          fontSize: '14px',
        },
      }}
      InputLabelProps={{
        shrink: false,
        sx: {
          color: 'text.primary',
          fontSize: '14px',
        },
      }}
    />
  )
}
