import { useContext, useState } from 'react'
import { Link, Box, Paper, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import NumberField from '@/components/common/NumberField'
import useSafeInfo from '@/hooks/useSafeInfo'

import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'

type FormFields = {
  safeTxGas: string
}

const Form = ({ onSubmit }: { onSubmit: () => void }) => {
  const { safeTxGas = '0', setSafeTxGas } = useContext(SafeTxContext)

  const formMethods = useForm<FormFields>({
    defaultValues: {
      safeTxGas,
    },
    mode: 'onChange',
  })

  const onFormSubmit = (values: FormFields) => {
    setSafeTxGas(values.safeTxGas || '0')
    onSubmit()
  }

  // Close the form w/o submitting if the user clicks outside of it
  const onBlur = () => {
    setTimeout(onSubmit, 100)
  }

  return (
    <Paper sx={{ position: 'absolute', zIndex: 2, p: 1, ml: '-22px' }} elevation={2}>
      <form onSubmit={formMethods.handleSubmit(onFormSubmit)} style={{ display: 'flex' }}>
        <NumberField
          size="small"
          autoFocus
          type="number"
          error={!!formMethods.formState.errors.safeTxGas}
          sx={{ width: '7em' }}
          {...formMethods.register('safeTxGas', {
            valueAsNumber: true,
            min: 0,
            setValueAs: Math.round,
            onBlur,
          })}
        />
        <Button type="submit" size="small" variant="contained" sx={{ ml: 1 }}>
          Save
        </Button>
      </form>
    </Paper>
  )
}

const SafeTxGasForm = () => {
  const { safeTx, safeTxGas = 0, isReadOnly } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const isOldSafe = safe.version && isLegacyVersion(safe.version)
  const isEditable = !isReadOnly && safeTx?.signatures.size === 0 && (Number(safeTxGas) > 0 || isOldSafe)
  const [editing, setEditing] = useState(false)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative',
      }}
    >
      {safeTxGas}
      {isEditable && (
        <Link
          component="button"
          onClick={() => setEditing(true)}
          sx={{
            fontSize: 'small',
          }}
        >
          Edit
        </Link>
      )}
      {editing && <Form onSubmit={() => setEditing(false)} />}
    </Box>
  )
}

export default SafeTxGasForm
