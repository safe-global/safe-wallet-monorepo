import styled from 'styled-components'
import TextFieldInput, { TextFieldInputProps } from './TextFieldInput'

type TextContractFieldTypes = TextFieldInputProps & {
  networkPrefix?: undefined | string
  getAddressFromDomain?: () => void
}

const TextContractField = ({
  networkPrefix: _networkPrefix,
  getAddressFromDomain: _getAddressFromDomain,
  ...props
}: TextContractFieldTypes) => {
  return <StyledTextField {...props} hiddenLabel={false} />
}

export default TextContractField

const StyledTextField = styled(TextFieldInput)`
  && {
    textarea {
      &.MuiInputBase-input {
        padding: 0;
      }
    }
  }
`
