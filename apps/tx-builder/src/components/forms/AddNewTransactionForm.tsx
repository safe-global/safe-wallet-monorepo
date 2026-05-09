import styled from 'styled-components'

import { ContractInterface } from '../../typings/models'
import { isValidAddress } from '../../utils'
import SolidityForm, {
  CONTRACT_METHOD_INDEX_FIELD_NAME,
  SolidityFormValuesTypes,
  TO_ADDRESS_FIELD_NAME,
  parseFormToProposedTransaction,
} from './SolidityForm'
import { useTransactions, useNetwork } from '../../store'
import { Typography } from '@mui/material'
import Button from '../Button'
import FixedIcon from '../FixedIcon'

type AddNewTransactionFormProps = {
  contract: ContractInterface | null
  to: string
  showHexEncodedData: boolean
}

const AddNewTransactionForm = ({ contract, to, showHexEncodedData }: AddNewTransactionFormProps) => {
  const initialFormValues = {
    [TO_ADDRESS_FIELD_NAME]: isValidAddress(to) ? to : '',
    [CONTRACT_METHOD_INDEX_FIELD_NAME]: '0',
  }

  const { addTransaction } = useTransactions()
  const { networkPrefix, getAddressFromDomain, nativeCurrencySymbol } = useNetwork()

  const onSubmit = (values: SolidityFormValuesTypes) => {
    const proposedTransaction = parseFormToProposedTransaction(values, contract, nativeCurrencySymbol, networkPrefix)

    addTransaction(proposedTransaction)
  }

  return (
    <>
      <Typography variant="body1" paragraph>
        Transaction information
      </Typography>

      <SolidityForm
        id="solidity-contract-form"
        initialValues={initialFormValues}
        contract={contract}
        getAddressFromDomain={getAddressFromDomain}
        nativeCurrencySymbol={nativeCurrencySymbol}
        networkPrefix={networkPrefix}
        onSubmit={onSubmit}
        showHexEncodedData={showHexEncodedData}
      >
        <ButtonContainer>
          {/* Add transaction btn */}
          <Button variant="contained" color="primary" type="submit">
            <FixedIcon type={'plus'} />
            <StyledButtonLabel>Add new transaction</StyledButtonLabel>
          </Button>
        </ButtonContainer>
      </SolidityForm>
    </>
  )
}

export default AddNewTransactionForm

const StyledButtonLabel = styled.span`
  margin-left: 8px;
`
const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;

  .MuiButton-root {
    padding-left: 10px;
  }

  span {
    display: flex;
  }
`
