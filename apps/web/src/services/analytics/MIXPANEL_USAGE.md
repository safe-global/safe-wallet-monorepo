# MixPanel User Attributes Tracking - Usage Guide

This document explains how to use the MixPanel user attributes tracking system in the Safe Wallet application.

## Overview

The MixPanel user attributes tracking system automatically collects and tracks user properties for cohort analysis and user segmentation. It tracks 9 key attributes about each Safe and its usage patterns.

## Architecture

### Key Components

1. **Types** (`types.ts`): TypeScript interfaces for user attributes
2. **User Attributes Collection** (`user-attributes.ts`): Logic to collect data from Safe state
3. **MixPanel Tracking** (`mixpanel-tracking.ts`): Functions to send data to MixPanel
4. **User Tracking Hook** (`useMixPanelUserTracking.ts`): React hook for automatic tracking

### Data Flow

```
Safe State → User Attributes Collection → MixPanel Tracking → MixPanel Dashboard
```

## Tracked Attributes

| Property | Type | Description | Use Case | MixPanel Name |
|----------|------|-------------|----------|---------------|
| `safe_id` | String | On-chain Safe address | Primary key for cohort analysis | "Safe ID" |
| `created_at` | Date | When Safe was deployed | User lifecycle analysis | "Created At" |
| `safe_version` | String | Safe contract version | Feature support filtering | "Safe Version" |
| `num_signers` | Number | Total number of signers | Engagement metric | "Number of Signers" |
| `threshold` | Number | Required signatures for execution | Setup intent analysis | "Threshold" |
| `networks` | Array | Blockchain networks used | Segmentation | "Networks" |
| `last_tx_at` | Date | Most recent transaction timestamp | Churn alerting | "Last Transaction At" |
| `space_id` | String | Parent Space ID (if applicable) | Space-level grouping | "Space ID" |
| `nested_safe_ids` | Array | Child Safe addresses | Nested Safe analysis | "Nested Safe IDs" |
| `total_tx_count` | Number | Lifetime transaction count | Engagement metric | "Total Transaction Count" |

## Automatic Tracking

The system automatically tracks user attributes when:

1. **Safe is loaded**: Initial attribute collection
2. **Safe changes**: New Safe selected
3. **Configuration changes**: Threshold or signers updated
4. **Transactions**: New transactions executed
5. **Network changes**: Different blockchain selected

## Usage Examples

### 1. Basic Integration (Already Implemented)

The tracking is automatically enabled in `_app.tsx`:

```typescript
import { useMixPanelUserTracking } from '@/hooks/analytics/useMixPanelUserTracking'

const InitApp = (): null => {
  // ... other hooks
  useMixPanelUserTracking() // Automatically tracks user attributes
  return null
}
```

### 2. Transaction Event Tracking

Use the transaction tracking hook in transaction components:

```typescript
import { useMixPanelTransactionTracking } from '@/hooks/analytics/useMixPanelUserTracking'
import { trackMixPanelEvent } from '@/services/analytics/mixpanel-tracking'

const TransactionComponent = () => {
  const { getTransactionEventProperties } = useMixPanelTransactionTracking()
  
  const handleTransactionSubmit = () => {
    const eventProperties = getTransactionEventProperties({
      transaction_type: 'token_transfer',
      amount: '100',
      token: 'USDC',
    })
    
    if (eventProperties) {
      trackMixPanelEvent('transaction_submitted', eventProperties)
    }
  }
  
  return <button onClick={handleTransactionSubmit}>Submit Transaction</button>
}
```

### 3. Safe Management Event Tracking

Use the management tracking hook for Safe configuration changes:

```typescript
import { useMixPanelSafeManagementTracking } from '@/hooks/analytics/useMixPanelUserTracking'
import { trackMixPanelEvent } from '@/services/analytics/mixpanel-tracking'

const AddOwnerComponent = () => {
  const { getSafeManagementEventProperties } = useMixPanelSafeManagementTracking()
  
  const handleAddOwner = () => {
    const eventProperties = getSafeManagementEventProperties({
      action: 'add_owner',
      new_threshold: 3,
    })
    
    if (eventProperties) {
      trackMixPanelEvent('owner_added', eventProperties)
    }
  }
  
  return <button onClick={handleAddOwner}>Add Owner</button>
}
```

### 4. Manual Attribute Updates

For special cases where you need to manually update attributes:

```typescript
import { 
  setMixPanelUserAttributes,
  incrementMixPanelUserAttributes,
  unionMixPanelUserAttributes 
} from '@/services/analytics/mixpanel-tracking'

// Update specific attributes (uses internal snake_case, displays as humanized names)
setMixPanelUserAttributes({
  safe_id: '0x123...',
  space_id: 'space_456',
  total_tx_count: 10,
})

// Increment transaction count (displays as "Total Transaction Count")
incrementMixPanelUserAttributes({
  total_tx_count: 1,
})

// Add new network to list (displays as "Networks")
unionMixPanelUserAttributes({
  networks: ['polygon'],
})
```

## Testing

### Unit Tests

Run the test suite:

```bash
yarn test user-attributes.test.ts
yarn test mixpanel-tracking.test.ts
```

### Manual Testing

1. **Enable Debug Mode**: Set `IS_PRODUCTION=false` in your environment
2. **Open Browser Console**: Check for MixPanel debug logs
3. **Navigate Between Safes**: Verify user identification and attribute updates
4. **Perform Transactions**: Check transaction-related attribute updates

### Debug Logs

In development mode, you'll see console logs like:

```
MixPanel user identified: 0x123...
MixPanel user attributes set: { "Safe ID": '0x123...', "Number of Signers": 2, ... }
MixPanel event tracked: transaction_submitted { "Safe ID": '0x123...', ... }
```

## Environment Configuration

Ensure your environment variables are set:

```bash
# Web app (.env.local)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Mobile app (.env.local)
EXPO_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

## Feature Flags

MixPanel tracking is controlled by the `MIXPANEL` feature flag in the chain configuration. It can be enabled/disabled per network.

## Privacy Considerations

- User identification is based on Safe addresses, not personal information
- All tracked data is related to Safe usage and blockchain interactions
- No personally identifiable information (PII) is collected
- Users can opt out of tracking through MixPanel's opt-out mechanisms

## Troubleshooting

### Common Issues

1. **Attributes not updating**: Check if MixPanel is properly initialized
2. **No user identification**: Verify Safe address is available
3. **Missing events**: Check feature flag and environment variables
4. **Test environment**: Ensure debug mode is enabled for development

### Debug Steps

1. Check browser console for MixPanel logs
2. Verify environment variables are set correctly
3. Ensure Safe data is loaded before tracking
4. Check MixPanel dashboard for incoming data

## Best Practices

1. **Don't track PII**: Only track Safe-related information
2. **Use appropriate update methods**: Use `$set_once` for unchanging attributes
3. **Batch updates**: Use batch operations for multiple attribute changes
4. **Test thoroughly**: Verify tracking in different scenarios
5. **Monitor performance**: Track the impact of analytics on app performance

## Mobile App Integration

The mobile app uses a similar system with React Native MixPanel SDK. The tracking logic is shared through the common types and patterns.

## Future Enhancements

1. **Space Integration**: Track Space-level attributes when available
2. **Nested Safe Detection**: Implement automatic nested Safe detection
3. **Advanced Segmentation**: Add more granular user segments
4. **Real-time Updates**: Implement WebSocket-based real-time updates
5. **A/B Testing**: Integrate with MixPanel's A/B testing features