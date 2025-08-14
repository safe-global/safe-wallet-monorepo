# Analytics Service

A clean, extensible analytics abstraction for Safe Wallet that properly handles the different requirements of GA4 and Mixpanel.

## 🎯 Key Features

- **Provider Abstraction**: Clean separation between GA4 and Mixpanel with their different parameter handling requirements
- **Smart Parameter Filtering**: GA4 only receives pre-registered custom parameters, Mixpanel gets everything
- **Type Safety**: Full TypeScript support with proper event definitions
- **Development Tools**: Built-in debugging and validation tools
- **Backward Compatibility**: Existing code continues to work during migration
- **Extensible**: Easy to add new analytics providers

## 🏗️ Architecture

```
Components
    ↓
Analytics API (analytics.track)
    ↓
AnalyticsManager
    ├── GoogleAnalyticsProvider (filters to registered params)
    └── MixpanelProvider (accepts all properties)
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { analytics, safeAnalytics } from '@/services/analytics'

// Track a Safe creation
safeAnalytics.safeCreated({
  chain_id: '1',
  deployment_type: 'standard',
  payment_method: 'wallet',
  threshold: 2,
  num_owners: 3,
  // GA gets only registered params
  // Mixpanel gets all params + enrichments
})

// Track a generic event
analytics.track('FEATURE_USED', {
  feature_name: 'batch_transactions',
  feature_category: 'transactions',
  user_segment: 'power_user',
})

// Track user actions
analytics.click('connect_wallet_button', {
  wallet_type: 'MetaMask',
  page_context: 'welcome',
})
```

### Setting Context

```typescript
// Set Safe context (affects all subsequent events)
safeAnalytics.setSafeContext('0x123...', '1', '1.4.1')
safeAnalytics.setWalletContext('MetaMask', '0x456...')

// Set global properties
analytics.setGlobalProperty('user_segment', 'enterprise')
analytics.setUserProperty('total_safes_owned', 5)
```

## 📊 Provider Differences

### Google Analytics 4
- **Requires** custom parameters to be pre-registered in GA4 dashboard
- Parameters are **filtered** to only include registered ones
- Limited to 25 custom event parameters
- Naming restrictions (no spaces, specific format)

### Mixpanel
- **Accepts any properties** without pre-registration
- Gets **all properties** plus enrichments
- Unlimited custom properties
- Flexible naming (spaces and special characters OK)

## 🔧 Event Configuration

Events are configured in `src/services/analytics/config/events.config.ts`:

```typescript
[StandardEvents.SAFE_CREATED]: {
  name: 'safe_created',
  providers: {
    ga: {
      enabled: true,
      eventName: 'safe_created',
      registeredParams: [
        'chain_id',
        'deployment_type', 
        'threshold',
        'num_owners'
      ], // Only these go to GA
    },
    mixpanel: {
      enabled: true,
      eventName: 'Safe Created',
      enrichProperties: (props) => ({
        ...props,
        creation_timestamp: Date.now(),
        app_version: packageJson.version,
        // All original props + enrichments go to Mixpanel
      }),
    },
  },
}
```

## 🛠️ Development Tools

### Browser Console

In development, analytics dev tools are available in the browser console:

```javascript
// Debug a specific event
__analyticsDevTools.debug('SAFE_CREATED', {
  chain_id: '1',
  deployment_type: 'standard',
  custom_property: 'test'
})

// Validate GA parameters
__analyticsDevTools.validate()

// Get system status
__analyticsDevTools.status()

// Simulate an event (dry run)
__analyticsDevTools.simulate('WALLET_CONNECTED', {
  wallet_type: 'MetaMask'
})

// Generate parameter report
__analyticsDevTools.report()

// Test integration
__analyticsDevTools.test()
```

### Code-Level Debugging

```typescript
import { analyticsDevTools } from '@/services/analytics'

// Debug what gets sent to each provider
analyticsDevTools?.debugEvent('SAFE_CREATED', {
  chain_id: '1',
  unregistered_param: 'filtered out for GA'
})

// Validate all GA parameters
const validation = analyticsDevTools?.validateGAParameters()
console.log('GA parameters valid:', validation?.valid)
```

## 📝 Adding New Events

### 1. Define the Event

```typescript
// In events.config.ts
[StandardEvents.NEW_FEATURE_USED]: {
  name: 'new_feature_used',
  providers: {
    ga: {
      enabled: true,
      eventName: 'new_feature',
      registeredParams: ['feature_name', 'chain_id'],
    },
    mixpanel: {
      enabled: true,
      eventName: 'New Feature Used',
      enrichProperties: (props) => ({
        ...props,
        usage_timestamp: Date.now(),
        user_cohort: getUserCohort(),
      }),
    },
  },
}
```

### 2. Add GA Parameters (if needed)

If you need new GA parameters:

1. Register them in your GA4 dashboard under Configure → Custom Definitions
2. Add to `GA_REGISTERED_PARAMETERS` in `core/types.ts`
3. Add to the event's `registeredParams` array

### 3. Use the Event

```typescript
analytics.track('NEW_FEATURE_USED', {
  feature_name: 'advanced_settings',
  chain_id: '1',
  detailed_context: 'only goes to Mixpanel',
})
```

## 🔄 Migration Guide

### From Old System

**Old:**
```typescript
import { trackEvent, MODAL_EVENTS } from '@/services/analytics'

trackEvent(MODAL_EVENTS.OPEN, {
  category: 'modals',
  action: 'Send tokens',
  label: 'main_interface'
})
```

**New:**
```typescript
import { analytics } from '@/services/analytics'

analytics.track('MODAL_OPENED', {
  modal_name: 'Send tokens',
  modal_context: 'main_interface'
})
```

### Safe App Events

**Old:**
```typescript
import { trackSafeAppEvent } from '@/services/analytics'

trackSafeAppEvent(
  { action: 'Open Safe App', category: 'safe_apps' },
  safeApp,
  { launchLocation: 'preview_drawer' }
)
```

**New:**
```typescript
import { safeAnalytics } from '@/services/analytics'

safeAnalytics.safeAppLaunched({
  safe_app_name: safeApp.name,
  launch_location: 'preview_drawer',
  chain_id: currentChainId,
  safe_app_url: safeApp.url,
})
```

## 🧪 Testing

### Unit Tests
```bash
yarn test src/services/analytics/__tests__/analytics.test.ts
```

### Manual Testing
```typescript
// Test GA parameter filtering
const result = analytics.track('SAFE_CREATED', {
  chain_id: '1', // ✅ Sent to GA
  deployment_type: 'standard', // ✅ Sent to GA
  custom_debug_info: 'detailed context', // ❌ Filtered from GA, ✅ Sent to Mixpanel
})

console.log('Tracking result:', result)
```

## 🚨 Important Notes

### GA4 Parameter Limits
- Maximum 25 custom event parameters per property
- Parameters must be registered in GA4 dashboard first
- Use consistent naming across events

### Mixpanel Best Practices
- Properties are immediately available for analysis
- Use consistent property names for better segmentation
- Take advantage of enrichment functions for additional context

### Performance
- Events are sent asynchronously
- Failed events don't block the UI
- Batch tracking available for multiple events

## 🔗 Related Files

- `core/types.ts` - Core interfaces and registered parameters
- `config/events.config.ts` - Event configurations
- `providers/ga/` - Google Analytics implementation
- `providers/mixpanel/` - Mixpanel implementation
- `utils/DevTools.ts` - Development utilities

## 📚 Additional Resources

- [GA4 Custom Parameters Guide](https://support.google.com/analytics/answer/10075209)
- [Mixpanel Event Properties Best Practices](https://docs.mixpanel.com/docs/tracking/how-tos/events-and-properties)
- [Safe Wallet Analytics Strategy](link-to-internal-docs)