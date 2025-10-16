// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StatusGroup, type LiveAnalysisResponse, type AnalysisResult, StatusGroupType } from '../types'
import { RecipientAddressBuilder } from './recipient-address.builder'
import { RecipientAnalysisResultBuilder } from './recipient-analysis-result.builder'

export class RecipientAnalysisBuilder {
  private recipient: {
    [address: string]: {
      [StatusGroup.ADDRESS_BOOK]?: AnalysisResult<StatusGroupType<StatusGroup.ADDRESS_BOOK>>[]
      [StatusGroup.RECIPIENT_INTERACTION]?: AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_INTERACTION>>[]
      [StatusGroup.RECIPIENT_ACTIVITY]?: AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_ACTIVITY>>[]
      [StatusGroup.BRIDGE]?: AnalysisResult<StatusGroupType<StatusGroup.BRIDGE>>[]
    }
  } = {}

  addAddress(address: string): RecipientAddressBuilder {
    if (!this.recipient[address]) {
      this.recipient[address] = {}
    }
    return new RecipientAddressBuilder(this, address)
  }

  build(): LiveAnalysisResponse['recipient'] {
    return [{ ...this.recipient }, undefined, false]
  }

  // Preset methods for common scenarios
  static knownRecipient(address: string = '0x0000000000000000000000000000000000000001'): RecipientAnalysisBuilder {
    return new RecipientAnalysisBuilder()
      .addAddress(address)
      .addressBookState([RecipientAnalysisResultBuilder.knownRecipient().build()])
      .done()
  }

  static newRecipient(address: string = '0x0000000000000000000000000000000000000002'): RecipientAnalysisBuilder {
    return new RecipientAnalysisBuilder()
      .addAddress(address)
      .interactionState([RecipientAnalysisResultBuilder.newRecipient().build()])
      .done()
  }

  static lowActivity(address: string = '0x0000000000000000000000000000000000000003'): RecipientAnalysisBuilder {
    return new RecipientAnalysisBuilder()
      .addAddress(address)
      .activityState([RecipientAnalysisResultBuilder.lowActivity().build()])
      .done()
  }

  static incompatibleSafe(address: string = '0x0000000000000000000000000000000000000004'): RecipientAnalysisBuilder {
    return new RecipientAnalysisBuilder()
      .addAddress(address)
      .bridgeState([RecipientAnalysisResultBuilder.incompatibleSafe().build()])
      .done()
  }

  // static unverifiedContract(address: string = '0x0000000000000000000000000000000000000bad'): RecipientAnalysisBuilder {
  //   return new RecipientAnalysisBuilder()
  //     .addAddress(address)
  //     .contractVerification([ContractAnalysisResultBuilder.unverified().build()])
  //     .done()
  // }

  // static knownContract(address: string = '0x0000000000000000000000000000000000000002'): RecipientAnalysisBuilder {
  //   return new RecipientAnalysisBuilder()
  //     .addAddress(address)
  //     .contractInteraction([ContractAnalysisResultBuilder.knownContract().build()])
  //     .done()
  // }

  // static delegatecallContract(
  //   address: string = '0x0000000000000000000000000000000000000004',
  // ): RecipientAnalysisBuilder {
  //   return new RecipientAnalysisBuilder()
  //     .addAddress(address)
  //     .delegatecall([ContractAnalysisResultBuilder.unexpectedDelegatecall().build()])
  //     .done()
  // }

  // static verificationUnavailableContract(
  //   address: string = '0x0000000000000000000000000000000000000005',
  // ): RecipientAnalysisBuilder {
  //   return new RecipientAnalysisBuilder()
  //     .addAddress(address)
  //     .contractVerification([ContractAnalysisResultBuilder.verificationUnavailable().build()])
  //     .done()
  // }
}
