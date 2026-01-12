import Box from '@mui/material/Box'
import { useForm, ValidateResult } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { SAVE_BATCH_PATH } from '../../routes/routes'
import { useTransactionLibrary } from '../../store'
import { Batch } from '../../typings/models'
import Field from '../forms/fields/Field'
import { TEXT_FIELD_TYPE } from '../forms/fields/fields'
import GenericModal from '../GenericModal'
import Button from '../Button'

type SaveBatchModalProps = {
  onClick: (name: string) => void
  onClose: () => void
}
const BATCH_NAME_FIELD = 'batchName'

type CreateBatchFormValuesTypes = {
  [BATCH_NAME_FIELD]: string
}

const SaveBatchModal = ({ onClick, onClose }: SaveBatchModalProps) => {
  const { handleSubmit, control } = useForm<CreateBatchFormValuesTypes>({
    mode: 'onTouched',
  })

  const { batches } = useTransactionLibrary()

  const navigate = useNavigate()

  const onSubmit = (values: CreateBatchFormValuesTypes) => {
    const { [BATCH_NAME_FIELD]: batchName } = values
    onClick(batchName.trim())
    navigate(SAVE_BATCH_PATH)
  }

  return (
    <GenericModal
      title="Save transaction Batch"
      withoutBodyPadding
      body={
        <StyledModalBodyWrapper>
          <form id={'create-batch-form'} onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field
              id="batch-name-input"
              name={BATCH_NAME_FIELD}
              label={'Batch name'}
              fieldType={TEXT_FIELD_TYPE}
              validations={[(value: string) => validateBatchName(value, batches)]}
              fullWidth
              required
              control={control}
              showErrorsInTheLabel={false}
            />
            <Box margin="0 auto" maxWidth={'150px'}>
              <Button fullWidth type="submit">
                Create
              </Button>
            </Box>
          </form>
        </StyledModalBodyWrapper>
      }
      onClose={onClose}
    />
  )
}

export default SaveBatchModal

const StyledModalBodyWrapper = styled.div`
  padding: 24px;
  max-width: 450px;
`

const validateBatchName = (batchName: string, batches: Batch[]): ValidateResult => {
  const batchNames = batches.map(({ name }) => name)
  const isBatchNameAlreadyTaken = batchNames.includes(batchName)

  if (isBatchNameAlreadyTaken) {
    return 'this Batch name is already taken'
  }

  const trimmedBatchName = batchName.trim()

  if (!trimmedBatchName) {
    return 'Required'
  }
}
