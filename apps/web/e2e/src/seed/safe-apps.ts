import { basicTypesTestContract, registerBuilderContracts } from '../../environment/scenarios/safe-apps.mjs'
import type { Journey } from '../fixtures/journey.fixture'

/** A contract on the Sepolia fork with simple setters, e.g. `testAddressValue(address newValue)` */
export const BASIC_TYPES_TEST_CONTRACT: string = basicTypesTestContract

/** Registers the ABIs that Transaction Builder reads from the local CGW: the test contract and the Safe singletons */
export async function seedTransactionBuilderContracts(journey: Journey): Promise<void> {
  await registerBuilderContracts(journey.env)
}
