import { SignOrExecuteForm } from '@/components/tx/SignOrExecuteForm/SignOrExecuteForm'
import * as hooks from '@/components/tx/SignOrExecuteForm/hooks'
import * as execThroughRoleHooks from '@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { render } from '@/tests/test-utils'
import { fireEvent } from '@testing-library/react'
import { encodeBytes32String } from 'ethers'
import { Status } from 'zodiac-roles-deployments'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

let isSafeOwner = true
// mock useIsSafeOwner
jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => isSafeOwner),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(() => '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67'),
}))

const txDetails = {
  safeAddress: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
  txId: 'multisig_0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67_0x938635afdeab5ab17b377896f10dbe161fcc44d488296bc0000b733623d57c80',
  executedAt: null,
  txStatus: 'AWAITING_EXECUTION',
  txInfo: {
    type: 'SettingsChange',
    humanDescription: 'Add new owner 0xd8dA...6045 with threshold 1',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          valueDecoded: null,
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
          valueDecoded: null,
        },
      ],
    },
    settingsInfo: {
      type: 'ADD_OWNER',
      owner: {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: null,
        logoUri: null,
      },
      threshold: 1,
    },
  },
  txData: {
    hexData:
      '0x0d582f13000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          valueDecoded: null,
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
          valueDecoded: null,
        },
      ],
    },
    to: {
      value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
      name: 'SafeProxy',
      logoUri: null,
    },
    value: '0',
    operation: 0,
    trustedDelegateCallTarget: null,
    addressInfoIndex: null,
  },
  txHash: null,
  detailedExecutionInfo: {
    type: 'MULTISIG',
    submittedAt: 1726497729356,
    nonce: 8,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: 'MetaMultiSigWallet',
      logoUri: null,
    },
    safeTxHash: '0x938635afdeab5ab17b377896f10dbe161fcc44d488296bc0000b733623d57c80',
    executor: null,
    signers: [
      {
        value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
        name: null,
        logoUri: null,
      },
    ],
    confirmationsRequired: 1,
    confirmations: [
      {
        signer: {
          value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
          name: null,
          logoUri: null,
        },
        signature:
          '0xd91721922d38384a4d40b20d923c49cefb56f60bfe0b357de11a4a044483d670075842d7bba26cf4aa84788ab0bd85137ad09c7f9cd84154db00d456b15e42dc1b',
        submittedAt: 1726497740521,
      },
    ],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: {
      value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      name: null,
      logoUri: null,
    },
  },
  safeAppInfo: null,
} as unknown as TransactionDetails

describe('SignOrExecute', () => {
  beforeEach(() => {
    isSafeOwner = true
  })

  it('should display a safeTxError', () => {
    const { getByText } = render(
      <SignOrExecuteForm
        txDetails={txDetails}
        txId="0x012312"
        onSubmit={jest.fn()}
        safeTxError={new Error('Safe transaction error')}
        safeTx={safeTxBuilder().build()}
        chainId="1"
      />,
    )

    expect(
      getByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).toBeInTheDocument()
  })

  describe('Existing transaction', () => {
    it('should display radio options to sign or execute if both are possible', () => {
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)

      const { getByText } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          safeTxError={undefined}
          isExecutable={true}
          chainId="1"
        />,
      )

      expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()
    })
  })

  describe('New transaction', () => {
    it('should display radio options to sign or execute if both are possible', () => {
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
      jest.spyOn(hooks, 'useImmediatelyExecutable').mockReturnValue(true)

      const { getByText } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTxError={undefined}
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          isExecutable={true}
          chainId="1"
        />,
      )

      expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()
    })

    it('should offer to execute through a role if the user is a role member and the transaction is executable through the role', () => {
      jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([TEST_ROLE_OK])
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
      jest.spyOn(hooks, 'useImmediatelyExecutable').mockReturnValue(false)

      const { queryByTestId } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTxError={undefined}
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          onlyExecute={true}
          isExecutable={false}
          chainId="1"
        />,
      )

      expect(queryByTestId('execute-through-role-form-btn')).toBeInTheDocument()
    })

    it('should not offer to execute through a role if the user is a safe owner and role member but the role lacks permissions', () => {
      jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([TEST_ROLE_TARGET_NOT_ALLOWED])
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
      jest.spyOn(hooks, 'useImmediatelyExecutable').mockReturnValue(false)
      isSafeOwner = true

      const { queryByTestId } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTxError={undefined}
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          onlyExecute={true}
          isExecutable={false}
          chainId="1"
        />,
      )

      expect(queryByTestId('execute-through-role-form-btn')).not.toBeInTheDocument()
    })

    it('should offer to execute through a role if the user is a role member but not a safe owner, even if the role lacks permissions', () => {
      jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([TEST_ROLE_TARGET_NOT_ALLOWED])
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
      jest.spyOn(hooks, 'useImmediatelyExecutable').mockReturnValue(false)
      isSafeOwner = false

      const { queryByTestId } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTxError={undefined}
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          onlyExecute={true}
          isExecutable={false}
          chainId="1"
        />,
      )

      expect(queryByTestId('execute-through-role-form-btn')).toBeInTheDocument()
    })

    it('should not offer to execute through a role if the transaction can also be directly executed without going through the role', () => {
      jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([TEST_ROLE_OK])
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)

      const { queryByTestId } = render(
        <SignOrExecuteForm
          txDetails={txDetails}
          txId="0x012312"
          safeTxError={undefined}
          safeTx={safeTxBuilder().build()}
          onSubmit={jest.fn()}
          onlyExecute={true}
          isExecutable={true}
          chainId="1"
        />,
      )

      expect(queryByTestId('execute-through-role-form-btn')).not.toBeInTheDocument()
    })
  })

  it('should not display radio options if execution is the only option', () => {
    jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([])

    const { queryByText } = render(
      <SignOrExecuteForm
        txDetails={txDetails}
        txId="0x012312"
        safeTxError={undefined}
        safeTx={safeTxBuilder().build()}
        onSubmit={jest.fn()}
        onlyExecute={true}
        chainId="1"
      />,
    )
    expect(queryByText('Would you like to execute the transaction immediately?')).not.toBeInTheDocument()
  })

  it('should display a sign/execute title if that option is selected', () => {
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)

    const { getByTestId, getByText } = render(
      <SignOrExecuteForm
        txDetails={txDetails}
        txId="0x012312"
        safeTxError={undefined}
        safeTx={safeTxBuilder().build()}
        onSubmit={jest.fn()}
        isExecutable={true}
        chainId="1"
      />,
    )

    expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()

    const executeCheckbox = getByTestId('execute-checkbox')
    const signCheckbox = getByTestId('sign-checkbox')

    expect(getByText("You're about to execute this transaction.")).toBeInTheDocument()

    fireEvent.click(signCheckbox)

    expect(getByText("You're about to confirm this transaction.")).toBeInTheDocument()

    fireEvent.click(executeCheckbox)

    expect(getByText("You're about to execute this transaction.")).toBeInTheDocument()
  })

  it('should not display safeTxError message for valid transactions', () => {
    const { queryByText } = render(
      <SignOrExecuteForm
        txDetails={txDetails}
        txId="0x012312"
        safeTxError={undefined}
        safeTx={safeTxBuilder().build()}
        onSubmit={jest.fn()}
        chainId="1"
      />,
    )

    expect(
      queryByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).not.toBeInTheDocument()
  })
})

const ROLES_MOD_ADDRESS = '0x1234567890000000000000000000000000000000'
const ROLE_KEY = encodeBytes32String('eth_wrapping')

const TEST_ROLE_OK: execThroughRoleHooks.Role = {
  modAddress: ROLES_MOD_ADDRESS,
  roleKey: ROLE_KEY as `0x${string}`,
  multiSend: '0x9641d764fc13c8b624c04430c7356c1c7c8102e2',
  status: Status.Ok,
}

const TEST_ROLE_TARGET_NOT_ALLOWED: execThroughRoleHooks.Role = {
  modAddress: ROLES_MOD_ADDRESS,
  roleKey: ROLE_KEY as `0x${string}`,
  multiSend: '0x9641d764fc13c8b624c04430c7356c1c7c8102e2',
  status: Status.TargetAddressNotAllowed,
}
