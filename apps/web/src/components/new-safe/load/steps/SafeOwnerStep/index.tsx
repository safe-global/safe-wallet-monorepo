import React, { useEffect } from 'react'
import { getSafeInfo, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Box, Button, Divider } from '@mui/material'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import type { NamedAddress } from '@/components/new-safe/create/types'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { OwnerRow } from '@/components/new-safe/OwnerRow'

enum Field {
  owners = 'owners',
  threshold = 'threshold',
}

type FormData = {
  [Field.owners]: NamedAddress[]
  [Field.threshold]: number
}

const SafeOwnerStep = ({ data, onSubmit, onBack }: StepRenderProps<LoadSafeFormData>) => {
  const chainId = useChainId()
  const formMethods = useForm<FormData>({
    defaultValues: data,
    mode: 'onChange',
  })
  const {
    handleSubmit,
    setValue,
    control,
    formState: { isValid },
    getValues,
  } = formMethods

  const { fields } = useFieldArray({
    control,
    name: Field.owners,
  })

  const [safeInfo] = useAsync<SafeInfo>(() => {
    if (data.address) {
      return getSafeInfo(chainId, data.address)
    }
  }, [chainId, data.address])

  useEffect(() => {
    if (!safeInfo) return

    setValue(Field.threshold, safeInfo.threshold)

    const owners = safeInfo.owners.map((owner, i) => ({
      address: owner.value,
      name: getValues(`owners.${i}.name`) || '',
    }))

    setValue(Field.owners, owners)
  }, [getValues, safeInfo, setValue])

  const handleBack = () => {
    onBack(getValues())
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box className={layoutCss.row}>
          {fields.map((field, index) => (
            <OwnerRow key={field.id} index={index} groupName="owners" readOnly />
          ))}
        </Box>
        <Divider />
        <Box className={layoutCss.row}>
          <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
            <Button variant="outlined" size="small" onClick={handleBack} startIcon={<ArrowBackIcon fontSize="small" />}>
              Back
            </Button>
            <Button type="submit" variant="contained" size="stretched" disabled={!isValid}>
              Next
            </Button>
          </Box>
        </Box>
      </form>
    </FormProvider>
  )
}

export default SafeOwnerStep
