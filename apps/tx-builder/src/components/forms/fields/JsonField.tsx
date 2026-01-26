import { useState, useCallback, ClipboardEvent } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Tooltip } from '@mui/material'
import useModal from '../../../hooks/useModal/useModal'
import { Icon, IconTypes } from '../../Icon'
import Text from '../../Text'
import GenericModal from '../../GenericModal'
import TextFieldInput from './TextFieldInput'

const DEFAULT_ROWS = 4

type Props = {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
}

const JsonField = ({ id, name, label, value, onChange }: Props) => {
  const { open: showReplaceModal, toggleModal } = useModal()
  const [tempAbi, setTempAbi] = useState(value)
  const [isPrettified, setIsPrettified] = useState(false)
  const hasError = isValidJSON(value) ? undefined : 'Invalid JSON value'

  const toggleFormatJSON = useCallback(() => {
    if (!value) {
      return
    }

    try {
      onChange(JSON.stringify(JSON.parse(value), null, isPrettified ? 0 : 2))
      setIsPrettified(!isPrettified)
    } catch (e) {
      console.error(e)
      onChange(value)
    }
  }, [onChange, value, isPrettified])

  const changeAbi = useCallback(() => {
    onChange(tempAbi)
    setIsPrettified(false)
    toggleModal()
  }, [tempAbi, onChange, toggleModal])

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const clipboardData = event.clipboardData
      const pastedData = clipboardData?.getData('Text') || ''

      if (value && pastedData) {
        setTempAbi(pastedData)
        toggleModal()
      } else {
        onChange(pastedData)
      }
    },
    [onChange, toggleModal, value],
  )

  return (
    <>
      <JSONFieldContainer>
        <StyledTextField
          id={id}
          name={name}
          label={label}
          multiline
          value={value}
          minRows={DEFAULT_ROWS}
          maxRows={DEFAULT_ROWS * 4}
          fullWidth
          hiddenLabel={false}
          onPaste={handlePaste}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          spellCheck={false}
          showErrorsInTheLabel={false}
          error={hasError}
        />

        <IconContainer error={!!hasError}>
          {!isPrettified && (
            <IconContainerButton
              error={!!hasError}
              tooltipLabel="Prettify JSON"
              iconType="code"
              onClick={toggleFormatJSON}
            />
          )}
          {isPrettified && (
            <IconContainerButton
              error={!!hasError}
              tooltipLabel="Stringify JSON"
              iconType="cross"
              onClick={toggleFormatJSON}
            />
          )}
        </IconContainer>
      </JSONFieldContainer>

      {showReplaceModal && (
        <GenericModal
          body={
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Text variant="body1">Do you want to replace the current ABI?</Text>
            </Box>
          }
          onClose={toggleModal}
          title="Replace ABI"
          footer={
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Button variant="outlined" onClick={toggleModal}>
                Cancel
              </Button>
              <Button variant="contained" onClick={changeAbi}>
                Accept
              </Button>
            </Box>
          }
        />
      )}
    </>
  )
}

const isValidJSON = (value: string | undefined) => {
  if (value) {
    try {
      JSON.parse(value)
    } catch {
      return false
    }
  }

  return true
}

const IconContainerButton = ({
  tooltipLabel,
  iconType,
  onClick,
  error,
}: {
  tooltipLabel: string
  iconType: IconTypes
  onClick: () => void
  error: boolean
}) => (
  <Tooltip title={tooltipLabel}>
    <StyledButton size="small" color="primary" onClick={onClick}>
      <Icon size="sm" color={error ? 'error' : 'primary'} type={iconType} />
    </StyledButton>
  </Tooltip>
)

const JSONFieldContainer = styled.div`
  position: relative;
`

const IconContainer = styled.div<{ error: boolean }>`
  position: absolute;
  top: -10px;
  right: 15px;
  border: 1px solid ${({ theme, error }) => (error ? theme.palette.error.main : theme.palette.primary.main)};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.palette.code.main};
`

const StyledTextField = styled(TextFieldInput)`
  && {
    textarea {
      font-family: monospace;
      font-size: 12px;
      &.MuiInputBase-input {
        padding: 0;
      }
    }
  }
`

const StyledButton = styled(IconButton)`
  margin: 0 5px;
`

export default JsonField
