# Base Contract Migration for Unsupported L2 Master Copies

## Overview

This implementation enables migration of Safe accounts with unsupported L2 master copies (base contracts) when their bytecode matches officially supported deployments. The feature is restricted to 1.3.0+L2 and 1.4.1+L2 contracts.

## Problem Statement

Previously, Safe accounts with base contracts not in the list of officially supported singleton contract deployments were considered unsupported and could not be migrated. This implementation fixes that by comparing the bytecode of unsupported implementations with official deployments.

## Solution

### 1. Bytecode Comparison Utility (`packages/utils/src/services/contracts/bytecodeComparison.ts`)

- **`compareWithSupportedL2Contracts()`**: Compares implementation bytecode with official L2 deployments (1.3.0 and 1.4.1)
- **`isSupportedL2Version()`**: Validates if a version is supported for bytecode comparison
- Uses `keccak256` hash comparison against deployment `codeHash` values
- Checks all deployment variants (canonical, eip155, zksync)

### 2. Safe Contracts Logic Update (`packages/utils/src/services/contracts/safeContracts.ts`)

- **`canMigrateUnsupportedMastercopy()`**: Determines if an unsupported mastercopy can be migrated based on:
  - Unsupported implementation status
  - Bytecode match with official L2 deployment
  - Migration contract deployed on the chain (works regardless of nonce)

### 3. Safe Core SDK Initialization (`apps/web/src/hooks/coreSDK/safeCoreSDK.ts`)

- Updated `initSafeSDK()` to perform bytecode comparison for unsupported master copies
- Only processes supported L2 versions (1.3.0 and 1.4.1)
- Fetches bytecode from chain and compares with official deployments
- Allows SDK initialization when bytecode matches, treating as L2 singleton

### 4. React Hook (`apps/web/src/hooks/useBytecodeComparison.ts`)

- **`useBytecodeComparison()`**: Custom hook for UI components
- Automatically fetches and compares bytecode when:
  - Mastercopy is unsupported
  - Version is 1.3.0+L2 or 1.4.1+L2
- Returns `BytecodeComparisonResult` with match status and matched version

### 5. UI Updates

#### UnsupportedMastercopyWarning Component (`apps/web/src/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning.tsx`)

- Updated to use `useBytecodeComparison()` hook
- Shows appropriate message when bytecode matches:
  - Indicates the contract is not in official list but bytecode matches
  - Displays the matched version
  - Enables migration button
- Falls back to standard unsupported message when no match

#### Safe Notifications (`apps/web/src/hooks/useSafeNotifications.ts`)

- Updated notification for unsupported master copies
- When migration is possible (bytecode match or standard L2 migration):
  - Message: "Please migrate your Safe to a supported base contract."
  - Link: "Migrate" button leading to settings/setup
- Falls back to CLI recommendation when migration is not possible

#### Unknown Contract Error (`apps/web/src/components/tx/SignOrExecuteForm/UnknownContractError.tsx`)

- Updated to check for bytecode-matching contracts
- Enables migration path for bytecode-matched unsupported contracts
- Shows migration-possible message instead of error-only message

## Restrictions

1. **Version Limitation**: Only 1.3.0+L2 and 1.4.1+L2 contracts are supported
2. **L2 Only**: Only L2 singleton contracts, not L1 contracts
3. **Migration Requirements**:
   - Migration contract must be deployed on the chain
   - Works regardless of Safe nonce (can migrate Safes with existing transactions)

## Testing

Tests added for:

- `bytecodeComparison.test.ts`: Tests for comparison logic
- `safeContracts.test.ts`: Tests for migration eligibility logic

## Files Modified/Created

### Created:

- `packages/utils/src/services/contracts/bytecodeComparison.ts`
- `packages/utils/src/services/contracts/__tests__/bytecodeComparison.test.ts`
- `packages/utils/src/services/contracts/__tests__/safeContracts.test.ts`
- `apps/web/src/hooks/useBytecodeComparison.ts`

### Modified:

- `packages/utils/src/services/contracts/safeContracts.ts`
- `apps/web/src/hooks/coreSDK/safeCoreSDK.ts`
- `apps/web/src/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning.tsx`
- `apps/web/src/hooks/useSafeNotifications.ts`
- `apps/web/src/components/tx/SignOrExecuteForm/UnknownContractError.tsx`

## Usage Flow

1. User loads Safe with unsupported mastercopy (1.3.0+L2 or 1.4.1+L2)
2. `initSafeSDK()` fetches bytecode and compares with official deployments
3. If match found, SDK initializes successfully
4. UI hook `useBytecodeComparison()` performs same check for display
5. `UnsupportedMastercopyWarning` shows migration option with appropriate message
6. User can proceed with migration via `MigrateSafeL2Flow`

## Technical Details

- Bytecode comparison uses `keccak256` hashing from `ethers`
- Checks against all deployment variants from `@safe-global/safe-deployments`
- Custom Safe Core SDK initialization required for bytecode-matched contracts
- Migration uses existing `createMigrateToL2()` transaction builder
