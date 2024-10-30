'use client'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import css from './styles.module.css'
import { Box, Button, Divider, Grid, InputAdornment, SvgIcon, Tooltip, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import NameInput from '@/components/common/NameInput'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import NetworkWarning from '../../NetworkWarning'
import type { NewSafeFormData } from '../..'
import useWallet from '@/hooks/wallets/useWallet'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'

type SetNameStepForm = {
  id: string
  name: string
}

enum SetNameStepFields {
  id = 'id',
  name = 'name',
}
const SET_NAME_STEP_FORM_ID = 'create-safe-set-name-step-form'

function SuperChainID({
  setSuperChainId,
  setWalletName,
  setStep,
  onSubmit,
}: {
  setSuperChainId: (id: string) => void
  setWalletName: (name: string) => void
  setStep: (step: number) => void
} & StepRenderProps<NewSafeFormData>) {
  const wallet = useWallet()
  const isWrongChain = useIsWrongChain()
  const router = useRouter()
  const formMethods = useForm<SetNameStepForm>({
    mode: 'all',
  })
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const suffix = '.superchain'

  const {
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = formMethods

  const onFormSubmit = async (data: Pick<NewSafeFormData, 'name'> & { id: string }) => {
    const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
    const isSuperChainIdRegistered = await SuperChainAccountContractReadOnly.superChainIDRegistered(data.id)
    if (isSuperChainIdRegistered) {
      setError(SetNameStepFields.id, {
        type: 'manual',
        message: 'Sorry, that Superchain ID already exists',
      })
      return
    }
    onSubmit({
      owners: [
        {
          address: wallet?.address || '',
          name: data.name || '',
          ens: '',
        },
      ],
      id: data.id,
      name: data.name,
    })
    setStep(1)
  }

  const onCancel = () => {
    router.push({ pathname: AppRoutes.index, query: router.query })
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onFormSubmit)} id={SET_NAME_STEP_FORM_ID}>
        <Box className={layoutCss.row}>
          <Grid container direction="column" spacing={1}>
            <Grid item xs>
              <NameInput
                name={SetNameStepFields.id}
                label={errors?.[SetNameStepFields.name]?.message || 'SuperChain ID'}
                placeholder="name"
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  onChange: (e) => {
                    e.target.value = e.target.value.toLocaleLowerCase()
                    if (!e.target.value.length) {
                      setSuperChainId('')
                      return
                    }
                    setSuperChainId(e.target.value + suffix)
                  },
                  endAdornment: (
                    <>
                      <InputAdornment position="end">
                        <Typography variant="body2" color="secondary.main">
                          {suffix}
                        </Typography>
                      </InputAdornment>
                      <Tooltip
                        title="This name is stored locally and will never be shared with us or any third parties."
                        arrow
                        placement="top"
                      >
                        <InputAdornment position="end">
                          <SvgIcon component={InfoIcon} inheritViewBox />
                        </InputAdornment>
                      </Tooltip>
                    </>
                  ),
                }}
              />
            </Grid>
            <Grid item xs>
              <NameInput
                name={SetNameStepFields.name}
                label={errors?.[SetNameStepFields.name]?.message || 'Wallet name (Optional)'}
                placeholder="Name"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  onChange: (e) => {
                    setWalletName(e.target.value)
                  },
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
          </Grid>
          {/* <Typography variant="body2" mt={2}>
            By continuing, you agree to our{' '}
            <Link href="/#" passHref legacyBehavior>
              <MUILink>terms of use</MUILink>
            </Link>{' '}
            and{' '}
            <Link href="/#" passHref legacyBehavior>
              <MUILink>privacy policy</MUILink>
            </Link>
            .
          </Typography> */}

          {isWrongChain && <NetworkWarning />}
        </Box>
        <Divider />
        <Box className={layoutCss.row}>
          <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
            <Button onClick={onCancel} data-testid="cancel-btn" variant="outlined" size="small">
              Cancel
            </Button>
            <Button
              className={css.submit}
              color="secondary"
              data-testid="next-btn"
              type="submit"
              variant="contained"
              size="stretched"
              disabled={!isValid || isWrongChain}
            >
              Next
            </Button>
          </Box>
        </Box>
      </form>
    </FormProvider>
  )
}

export default SuperChainID
