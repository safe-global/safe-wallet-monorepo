import { InputAdornment, Tooltip, SvgIcon, Typography, Box, Divider, Button, Grid } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import InfoIcon from '@/public/images/notifications/info.svg'
import NetworkSelector from '@/components/common/NetworkSelector'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'

import css from '@/components/new-safe/create/steps/SetNameStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import NameInput from '@/components/common/NameInput'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import MUILink from '@mui/material/Link'
import Link from 'next/link'
import { useIsUnsupportedChain } from '@/hooks/useIsUnsupportedChain'

type SetNameStepForm = {
  name: string
}

enum SetNameStepFields {
  name = 'name',
}

const SET_NAME_STEP_FORM_ID = 'create-safe-set-name-step-form'

function SetNameStep({
  data,
  onSubmit,
  setStep,
  setSafeName,
}: StepRenderProps<NewSafeFormData> & { setSafeName: (name: string) => void }) {
  const fallbackName = useMnemonicSafeName()
  const isWrongChain = useIsWrongChain()
  useSyncSafeCreationStep(setStep)

  const formMethods = useForm<SetNameStepForm>({
    mode: 'all',
    defaultValues: {
      [SetNameStepFields.name]: data.name,
    },
  })

  const {
    handleSubmit,
    formState: { errors, isValid },
  } = formMethods

  const onFormSubmit = (data: Pick<NewSafeFormData, 'name'>) => {
    const name = data.name || fallbackName
    setSafeName(name)
    onSubmit({ ...data, name })

    if (data.name) {
      trackEvent(CREATE_SAFE_EVENTS.NAME_SAFE)
    }
  }

  const isUnsupportedChain = useIsUnsupportedChain()
  const isDisabled = isWrongChain || !isValid || isUnsupportedChain

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onFormSubmit)} id={SET_NAME_STEP_FORM_ID}>
        <Box className={layoutCss.row}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={8}>
              <NameInput
                name={SetNameStepFields.name}
                label={errors?.[SetNameStepFields.name]?.message || 'Name'}
                placeholder={fallbackName}
                InputLabelProps={{ shrink: true }}
                disabled={isUnsupportedChain}
                InputProps={{
                  endAdornment: (
                    <Tooltip
                      title="This name is stored locally and will never be shared with us or any third parties."
                      arrow
                      placement="top"
                    >
                      <InputAdornment position="end">
                        <SvgIcon component={InfoIcon} inheritViewBox />
                      </InputAdornment>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item>
              <Box className={css.select} data-cy="create-safe-select-network">
                <NetworkSelector />
              </Box>
            </Grid>
          </Grid>
          <Typography variant="body2" mt={2}>
            By continuing, you agree to our{' '}
            <Link href={AppRoutes.terms} passHref legacyBehavior>
              <MUILink>terms of use</MUILink>
            </Link>{' '}
            and{' '}
            <Link href={AppRoutes.privacy} passHref legacyBehavior>
              <MUILink>privacy policy</MUILink>
            </Link>
            .
          </Typography>

          {(isWrongChain || isUnsupportedChain) && <NetworkWarning />}
        </Box>
        <Divider />
        <Box className={layoutCss.row}>
          <Box display="flex" flexDirection="row" justifyContent="flex-end" gap={3}>
            <Button type="submit" variant="contained" size="stretched" disabled={isDisabled}>
              Next
            </Button>
          </Box>
        </Box>
      </form>
    </FormProvider>
  )
}

export default SetNameStep
