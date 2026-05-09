import styled from 'styled-components'
import { ProposedTransaction } from '../../typings/models'
import SolidityForm, {
  CONTRACT_METHOD_INDEX_FIELD_NAME,
  CONTRACT_VALUES_FIELD_NAME,
  CUSTOM_TRANSACTION_DATA_FIELD_NAME,
  NATIVE_VALUE_FIELD_NAME,
  parseFormToProposedTransaction,
  SolidityFormValuesTypes,
  TO_ADDRESS_FIELD_NAME,
} from '../forms/SolidityForm'
import { weiToEther } from '../../utils'
import GenericModal from '../GenericModal'
import Button from '../Button'

type EditTransactionModalProps = {
  txIndex: number
  transaction: ProposedTransaction
  onSubmit: (newTransaction: ProposedTransaction) => void
  onDeleteTx: () => void
  onClose: () => void
  nativeCurrencySymbol: string | undefined
  networkPrefix: string | undefined
  getAddressFromDomain: (name: string) => Promise<string>
}

const EditTransactionModal = ({
  txIndex,
  transaction,
  onSubmit,
  onDeleteTx,
  onClose,
  nativeCurrencySymbol,
  networkPrefix,
  getAddressFromDomain,
}: EditTransactionModalProps) => {
  const { description, contractInterface } = transaction

  const { customTransactionData, contractFieldsValues, contractMethodIndex } = description

  const isCustomHexDataTx = !!customTransactionData

  const initialFormValues: Partial<SolidityFormValuesTypes> = {
    [TO_ADDRESS_FIELD_NAME]: transaction.raw.to,
    [NATIVE_VALUE_FIELD_NAME]: weiToEther(transaction.raw.value),
    [CUSTOM_TRANSACTION_DATA_FIELD_NAME]: customTransactionData,
    [CONTRACT_METHOD_INDEX_FIELD_NAME]: contractMethodIndex,
    [CONTRACT_VALUES_FIELD_NAME]: {
      [`method-${contractMethodIndex}`]: contractFieldsValues || {},
    },
  }

  const handleSubmit = (values: SolidityFormValuesTypes) => {
    const editedTransaction = parseFormToProposedTransaction(
      values,
      contractInterface,
      nativeCurrencySymbol,
      networkPrefix,
    )

    // keep the id of the transaction
    onSubmit({ ...editedTransaction, id: transaction.id })
  }

  return (
    <GenericModal
      title={`Transaction ${txIndex + 1}`}
      body={
        <FormContainer>
          <SolidityForm
            id="solidity-contract-form"
            initialValues={initialFormValues}
            contract={contractInterface}
            nativeCurrencySymbol={nativeCurrencySymbol}
            networkPrefix={networkPrefix}
            getAddressFromDomain={getAddressFromDomain}
            showHexEncodedData={!!isCustomHexDataTx}
            onSubmit={handleSubmit}
          >
            <ButtonContainer>
              {/* Remove transaction btn */}
              <Button type="button" color="error" onClick={onDeleteTx}>
                Delete
              </Button>

              {/* Add transaction btn */}
              <Button color="primary" type="submit">
                Save transaction
              </Button>
            </ButtonContainer>
          </SolidityForm>
        </FormContainer>
      }
      onClose={onClose}
    />
  )
}

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
`

const FormContainer = styled.div`
  width: 400px;
  padding: 24px;
  border-radius: 8px;

  background-color: ${({ theme }) => theme.palette.background.paper};
`

export default EditTransactionModal
