import TextContractField from './TextContractField'
import { TextFieldInputProps } from './TextFieldInput'

const DEFAULT_ROWS = 4

const TextareaContractField = (props: TextFieldInputProps) => {
  return <TextContractField {...props} multiline rows={props.rows || DEFAULT_ROWS} />
}

export default TextareaContractField
