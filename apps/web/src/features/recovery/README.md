# Recovery Feature

The Recovery feature enables Safe Account owners to designate trusted individuals (recoverers) who can help restore access to the account if the owners lose their keys or access.

## Overview

Account recovery uses a [Zodiac Delay Modifier](https://github.com/gnosis/zodiac-modifier-delay) module that introduces a time-delayed recovery mechanism. This provides a security buffer where owners can review and cancel malicious recovery attempts while legitimate recoverers can help restore access when needed.

### Key Concepts

- **Recoverer**: A trusted address designated by the Safe owners who can propose recovery transactions
- **Delay Modifier**: A Zodiac module attached to the Safe that queues recovery proposals with a mandatory time delay
- **Review Window**: The time period (cooldown) that must pass before a recovery proposal can be executed
- **Expiration**: Optional time limit after which a recovery proposal expires and can no longer be executed

## Architecture

This feature follows the Feature-Sliced Architecture pattern with lazy loading:

- **Components**: Lazy-loaded via `useLoadFeature(RecoveryFeature)`
- **Hooks**: Direct exports (always loaded, not lazy)
- **Services**: Lazy-loaded with components
- **Store**: Uses React context (`RecoveryContext`) for state management

## User Flows

### 1. Setup Recovery (Owners)

**Actor**: Safe Owner

Owners can set up recovery protection by:

1. Navigating to Settings → Security & Login → Account recovery
2. Clicking "Set up recovery"
3. Configuring:
   - **Recoverer address**: The trusted wallet that can propose recovery
   - **Review window** (cooldown): Time delay before proposal can be executed (e.g., 7 days)
   - **Proposal expiration**: Optional time after which proposals expire (0 = never expires)
4. Executing the transaction to deploy and enable the Delay Modifier module

**Under the hood**:

- Deploys a new Delay Modifier contract
- Enables it as a module on the Safe
- Adds the recoverer address as a module on the Delay Modifier

### 2. Propose Recovery (Recoverer)

**Actor**: Designated Recoverer

When owners lose access, the recoverer can:

1. Connect their wallet (must be the designated recoverer address)
2. See the "Recover this Account" card on the dashboard
3. Click "Start recovery"
4. Configure the new owner structure:
   - Add new owner addresses
   - Set new signing threshold
5. Submit the recovery proposal transaction

**Under the hood**:

- Calls `execTransactionFromModule` on the Delay Modifier
- Queues a transaction that will call `swapOwner`/`addOwnerWithThreshold` on the Safe
- Transaction is marked with a timestamp and enters the review window

### 3. Review Period (Monitoring)

**Actors**: Owners, Recoverers, Community

During the review window:

- The proposal appears in the transaction queue as "Pending recovery"
- Shows countdown until executable
- Displays proposal details (new owners, threshold)
- Flags malicious proposals (transactions not targeting the Safe itself)

**States**:

- **Pending**: Waiting for review window to complete
- **Executable**: Review window passed, can be executed
- **Expired**: Proposal expiration time passed (if configured)

### 4. Execute Recovery (Anyone)

**Actor**: Anyone (typically the recoverer or community member)

Once the review window passes:

1. The proposal shows "Awaiting execution" status
2. Click "Execute" button
3. Transaction is executed, applying the new owner structure

**Under the hood**:

- Calls `executeNextTx` on the Delay Modifier
- Delay Modifier calls the Safe to modify owners/threshold
- Original owners lose access, new owners gain control

### 5. Cancel Recovery (Owners)

**Actor**: Safe Owner

If a recovery proposal is malicious or unwanted:

1. Owners see the proposal flagged as "Malicious transaction" if it's suspicious
2. Click "Cancel" button
3. Choose cancellation method:
   - **Owners**: Create a regular Safe transaction to skip the proposal
   - **Non-owners** (after expiration): Call `skipExpired` directly

**Under the hood**:

- Owners create a transaction calling `setTxNonce` on the Delay Modifier
- This skips the malicious proposal in the queue
- Or, after expiration, anyone can call `skipExpired` to clean up

## How It Works

### Delay Modifier Architecture

```
┌─────────────────┐
│   Safe Account  │
│   (Owners: A,B) │
└────────┬────────┘
         │ enableModule
         ▼
┌─────────────────────┐
│  Delay Modifier     │
│  - cooldown: 7 days │
│  - expiration: 0    │
│  - txNonce: 0       │
│  - queueNonce: 0    │
└────────┬────────────┘
         │ enableModule
         ▼
┌─────────────────┐
│  Recoverer (C)  │
└─────────────────┘
```

### Recovery Proposal Flow

```
1. Recoverer proposes recovery
   │
   ├─> Delay Modifier queues transaction
   │   - timestamp: now
   │   - validFrom: now + cooldown
   │   - expiresAt: validFrom + expiration (or null)
   │
2. Review window (cooldown period)
   │
   ├─> Owners can monitor and cancel if malicious
   │
3. After cooldown passes
   │
   ├─> Anyone can execute
   │   └─> Delay Modifier → Safe.swapOwner(A, NewOwner)
   │
4. Recovery complete
   └─> Safe now has new owners
```

### Malicious Detection

The feature includes automatic detection of suspicious recovery proposals:

- **Safe**: Recovery must call the Safe itself (not external contracts)
- **MultiSend**: If using MultiSend, must use official deployment and only call the Safe
- **Operations**: Must be owner management operations (add/swap/remove owners, change threshold)

Malicious proposals are flagged with a warning icon and message.

## Components

### Cards

- **RecoveryProposalCard**: Prompts recoverers to start recovery
- **RecoveryInProgressCard**: Shows active recovery proposal status

### UI Components

- **RecoveryList**: Displays queued recovery proposals
- **RecoveryListItem**: Individual recovery item in the queue
- **RecoveryInfo**: Warning icon for malicious proposals
- **RecoveryStatus**: Status chip (Pending/Executable/Expired)
- **RecoveryType**: Transaction type indicator
- **RecoveryDescription**: Details about the recovery proposal
- **RecoveryValidationErrors**: Validation messages
- **RecoverySigners**: Timeline showing created/executable status

### Buttons

- **ExecuteRecoveryButton**: Execute a ready proposal
- **CancelRecoveryButton**: Cancel a proposal
- **SetupRecoveryButton**: Initiate recovery setup

### Context

- **RecoveryContext**: Provides recovery state to all components
- **RecoveryContextHooks**: Manages recovery state and events

## Hooks

### Public Hooks (Exported from `index.ts`)

```typescript
import {
  useIsRecoverer,
  useIsRecoverySupported,
  useIsValidRecoveryExecTransactionFromModule,
  useRecovery,
  useRecoveryQueue,
} from '@/features/recovery'

// Check if current wallet is a recoverer
const isRecoverer = useIsRecoverer()

// Check if recovery is supported for current Safe
const isSupported = useIsRecoverySupported()

// Validate recovery execution
const [isValid, error] = useIsValidRecoveryExecTransactionFromModule(item)

// Get full recovery state [recoveryState, isRecoveryEnabled, isWrongChain]
const [state, enabled, wrongChain] = useRecovery()

// Get recovery queue for current Safe
const queue = useRecoveryQueue()
```

### Internal Hooks

- `useRecoveryDelayModifiers`: Fetches delay modifiers for current Safe
- `useRecoveryPendingTxs`: Tracks pending recovery transactions
- `useRecoverySuccessEvents`: Listens for recovery transaction events
- `useRecoveryTxState`: Computes recovery transaction state
- `useRecoveryTxNotifications`: Shows toast notifications for recovery events
- `useClock`: Provides current time for countdown calculations

## Services

### Core Services (Exported from feature)

```typescript
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'

const recovery = useLoadFeature(RecoveryFeature)

// Check if ready
if (recovery.$isReady) {
  // Selectors
  const delayModifier = recovery.selectDelayModifierByRecoverer(state, recovererAddress)
  const queues = recovery.selectRecoveryQueues(state)

  // Transaction builders
  const skipTx = await recovery.getRecoverySkipTransaction(...)
  const proposalTxs = await recovery.getRecoveryProposalTransactions(...)
  const upsertTxs = await recovery.getRecoveryUpsertTransactions(...)

  // Dispatchers
  await recovery.dispatchRecoveryProposal(...)
  await recovery.dispatchRecoveryExecution(...)
}
```

### Service Files

- **recovery-state.ts**: State management, queue fetching
- **selectors.ts**: Redux-style selectors for recovery state
- **transaction.ts**: Transaction builders for recovery operations
- **recovery-sender.ts**: Dispatchers for sending recovery transactions
- **setup.ts**: Setup and edit recovery configuration
- **delay-modifier.ts**: Delay Modifier contract interactions
- **proxies.ts**: Proxy contract detection utilities
- **recoveryEvents.ts**: Event system for recovery transactions

## State Management

The feature uses a custom React context store (`RecoveryContext`) that:

- Fetches recovery state from Delay Modifiers
- Tracks pending transactions
- Subscribes to recovery events
- Provides recovery queue to all components

State structure:

```typescript
type RecoveryContextType = {
  state: [
    RecoveryState | undefined, // Recovery modules and queues
    boolean | undefined, // Is recovery enabled
    boolean, // Is wrong chain
  ]
  pending?: Record<string, PendingRecoveryTx> // Pending txs by hash
}
```

## Types

```typescript
// Core types
export type { RecoveryQueueItem, RecoveryStateItem, RecoveryState } from './services/recovery-state'

// Queue item
interface RecoveryQueueItem {
  transactionHash: string
  timestamp: bigint // When proposal was created
  validFrom: bigint // When it can be executed
  expiresAt: bigint | null // When it expires (null = never)
  isMalicious: boolean // Is this a suspicious proposal
  executor: string // Who created the proposal
  args: {
    txHash: string
    to: string
    value: bigint
    data: string
    operation: number
  }
}

// Recovery module state
interface RecoveryStateItem {
  address: string // Delay Modifier address
  recoverers: string[] // List of recoverer addresses
  delay: bigint // Cooldown period
  expiry: bigint // Expiration time (0 = never)
  txNonce: bigint // Next tx to execute
  queueNonce: bigint // Next queue slot
  queue: RecoveryQueueItem[] // Queued proposals
}
```

## Usage Examples

### Display Recovery Status

```typescript
import { RecoveryFeature, useRecoveryQueue } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'

function RecoveryStatus() {
  const recovery = useLoadFeature(RecoveryFeature)
  const queue = useRecoveryQueue()

  if (queue.length === 0) return null

  return (
    <div>
      <h3>Recovery Proposals</h3>
      {queue.map(item => (
        <div key={item.transactionHash}>
          <recovery.RecoveryType
            isMalicious={item.isMalicious}
            date={item.timestamp}
          />
          <recovery.RecoveryInfo isMalicious={item.isMalicious} />
          <recovery.RecoveryStatus recovery={item} />
        </div>
      ))}
    </div>
  )
}
```

### Setup Recovery

```typescript
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'

function SetupRecovery() {
  const recovery = useLoadFeature(RecoveryFeature)

  const handleSetup = async () => {
    if (!recovery.$isReady) return

    const transactions = await recovery.getRecoveryUpsertTransactions({
      delay: '604800',      // 7 days in seconds
      expiry: '0',          // Never expires
      recoverer: '0x...',   // Recoverer address
      provider,
      chainId,
      safeAddress,
    })

    // Submit transactions to Safe
  }

  return <button onClick={handleSetup}>Setup Recovery</button>
}
```

### Check if Recoverer

```typescript
import { useIsRecoverer, useIsRecoverySupported } from '@/features/recovery'

function RecoveryActions() {
  const isRecoverer = useIsRecoverer()
  const isSupported = useIsRecoverySupported()

  if (!isSupported) return null
  if (!isRecoverer) return <div>Not a recoverer</div>

  return <div>You can propose recovery for this Safe</div>
}
```

## Security Considerations

### Time Delays

- **Mandatory cooldown**: Prevents instant takeover attacks
- **Owner review period**: Allows owners to monitor and cancel malicious proposals
- **Optional expiration**: Proposals can't be executed indefinitely

### Malicious Detection

- Validates that recovery only modifies the Safe's owner structure
- Detects external contract calls that could drain funds
- Flags suspicious proposals in the UI

### Cancellation

- Owners can always cancel proposals before execution
- After expiration, anyone can clean up expired proposals
- Uses `setTxNonce` to skip malicious entries in the queue

### Multi-Signature Safety

- Recovery is a single point of failure - choose recoverers carefully
- Consider multiple recoverers or additional delays for high-value accounts
- Owners should monitor recovery proposals regularly

## References

- [Zodiac Delay Modifier](https://github.com/gnosis/zodiac-modifier-delay)
- [Safe Modules Documentation](https://docs.safe.global/safe-smart-account/modules)
- [Feature Architecture Guide](../../docs/feature-architecture.md)
