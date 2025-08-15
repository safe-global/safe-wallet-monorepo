# Safe Wallet Analytics Migration Plan

## Overview

This document outlines the **comprehensive single-MR migration** from the legacy analytics system to the new analytics abstraction layer. The migration approach is **all-in-one cleanup** that completely replaces the legacy system while ensuring zero regression.

## Current State Analysis

### Legacy System Usage
- **358 occurrences** of `trackEvent` calls across 128 files (GA only)
- **4 occurrences** of `trackMixPanelEvent` calls (Mixpanel only)
- **35 occurrences** of `useAnalytics` calls across 6 files  
- Legacy GTM and Mixpanel functions still handle 95% of events

### Provider-Specific Routing (Critical!)
Current system has **separate tracking functions**:
- `trackEvent()` → **GA only** (358 calls)
- `trackMixPanelEvent()` → **Mixpanel only** (4 calls)
- Some events go to both (like Safe App launches)
- **⚠️ Migration must preserve this routing behavior**

### Architecture Status
- ✅ **90% complete** - Core architecture implemented
- ⚠️ **20% integrated** - Limited adoption in components
- ❌ **10% migrated** - Most events use legacy system

### Test Coverage Analysis
- ✅ **10 analytics test files** exist with good coverage
- ✅ **Legacy system tests** verify GA/Mixpanel separation 
- ✅ **New system tests** cover providers and core functionality
- **⚠️ Missing migration parity tests** (need to add)

## Migration Strategy: Complete Replacement

### Approach: Direct Legacy System Replacement
**Goal**: Replace all legacy analytics calls with the new system in a single comprehensive merge request

#### Key Principles
1. **Complete Replacement**: No hybrid system - full cutover to new architecture
2. **Event Parity**: Every legacy event mapped to new EVENT catalog  
3. **Zero Regression**: Maintain identical tracking behavior
4. **Type Safety**: Leverage TypeScript for compile-time validation
5. **Clean Slate**: Remove all legacy code in same MR

### Migration Tasks

#### 1. TEST-FIRST APPROACH: Migration Parity Tests
- [ ] **Create migration parity test suite** - Test legacy vs new system behavior
- [ ] **Provider routing tests** - Verify GA-only vs Mixpanel-only vs both routing  
- [ ] **Event payload tests** - Ensure identical data sent to providers
- [ ] **Context preservation tests** - Verify chainId, safeAddress, etc. maintained

#### 2. Legacy Event Mapping & Catalog Expansion
- [ ] **Audit all legacy events** - Map every `trackEvent` call to new EVENT schema
- [ ] **Map provider-specific routing** - Preserve GA-only vs Mixpanel-only behavior
- [ ] **Expand EVENT catalog** - Add missing event schemas to `events/catalog.ts`
- [ ] **Create transformation utilities** - Build legacy-to-modern event converters

#### 3. Provider Enhancement with Routing
- [ ] **Implement event routing middleware** - Control which events go to which providers
- [ ] **Remove MixpanelProvider whitelist** - Use router instead for filtering
- [ ] **Direct GA4/Mixpanel integration** - Remove legacy GTM wrapper dependencies  
- [ ] **Event normalization** - Ensure consistent event naming across providers

#### 4. Component Migration with Routing Preservation (All 128 Files)
- [ ] **Replace `trackEvent` with `track()`** - GA-only events use router exclusion
- [ ] **Replace `trackMixPanelEvent` with `track()`** - Mixpanel-only events use router inclusion
- [ ] **Update imports** - Change all `@/services/analytics` imports to use new exports
- [ ] **Add type safety** - Ensure all events use EVENT constants and proper payload types

#### 5. Legacy Code Removal
- [ ] **Delete legacy functions** - Remove `trackEvent`, `gtmTrack`, `mixpanelTrack`
- [ ] **Clean up event constants** - Remove old event definitions from `/events/` folder  
- [ ] **Remove unused utilities** - Delete legacy analytics utilities and helpers
- [ ] **Update exports** - Clean up `/services/analytics/index.ts` to only export new system

## Implementation Details

### Component Migration Pattern

```typescript
// Before (Legacy) - GA Only
import { trackEvent, WALLET_EVENTS } from '@/services/analytics'

const handleConnect = () => {
  trackEvent({
    event: WALLET_EVENTS.CONNECT,
    category: 'wallet',
    action: 'connect'
  })
}

// Before (Legacy) - Mixpanel Only  
import { trackMixPanelEvent, MixPanelEvent } from '@/services/analytics'

const handleSafeAppLaunch = () => {
  trackMixPanelEvent(MixPanelEvent.SAFE_APP_LAUNCHED, {
    'Safe App Name': appName,
    'Safe App Tags': appTags
  })
}

// After (Modern) - GA Only (using router exclusion)
import { useAnalytics, EVENT } from '@/services/analytics'

const { track } = useAnalytics()
const handleConnect = () => {
  track({
    name: EVENT.WalletConnected,
    payload: {
      wallet_label: walletLabel,
      wallet_address: address,
      chain_id: chainId.toString()
    }
  }, {
    excludeProviders: ['mixpanel'] // GA only
  })
}

// After (Modern) - Mixpanel Only (using router inclusion)
const handleSafeAppLaunch = () => {
  track({
    name: EVENT.SafeAppLaunched,
    payload: {
      app_name: appName,
      app_url: appUrl,
      category: appCategory,
      safe_address: safeAddress,
      chain_id: chainId.toString()
    }
  }, {
    includeProviders: ['mixpanel'] // Mixpanel only
  })
}

// After (Modern) - Both Providers (default behavior)
const handleTransaction = () => {
  track({
    name: EVENT.TransactionCreated,
    payload: {
      tx_type: 'transfer_token',
      safe_address: safeAddress,
      chain_id: chainId.toString()
    }
    // No routing options = both providers
  })
}
```

### Legacy Event Mapping Strategy

```typescript
// Direct replacement mapping for most common patterns
const EVENT_MIGRATION_MAP = {
  // Legacy pattern -> Modern equivalent
  'WALLET_EVENTS.CONNECT' -> 'EVENT.WalletConnected',
  'TX_EVENTS.CREATE' -> 'EVENT.TransactionCreated', 
  'SAFE_EVENTS.CREATE' -> 'EVENT.SafeCreated',
  'SAFE_APPS_EVENTS.OPEN' -> 'EVENT.SafeAppLaunched'
}
```

### Provider Simplification

```typescript
// Remove legacy wrapper dependencies
export class GoogleAnalyticsProvider {
  track(event: AnalyticsEvent): void {
    // Direct GA4 integration - no legacy gtmTrack wrapper
    sendGAEvent('event', this.normalizeEventName(event.name), {
      ...this.normalizePayload(event.payload),
      ...this.extractContext(event.context)
    })
  }
}

export class MixpanelProvider { 
  track(event: AnalyticsEvent): void {
    // Direct Mixpanel integration - no event filtering
    mixpanel.track(this.toPascalCase(event.name), {
      ...this.normalizePayload(event.payload),
      ...this.extractContext(event.context)
    })
  }
}
```

## Risk Mitigation

### 1. Zero Regression Approach
- **Comprehensive Testing**: Test all analytics events before/after migration
- **Event Parity Verification**: Ensure identical events are sent to GA/Mixpanel  
- **Type Safety**: Leverage TypeScript to catch issues at compile time

### 2. Rollback Strategy
- **Git Branch Isolation**: Complete migration in feature branch
- **Easy Revert**: Single MR revert restores entire legacy system
- **Staging Validation**: Full testing in staging environment before merge

### 3. Data Continuity
- **Same Provider SDKs**: Use same underlying GA4/Mixpanel SDKs
- **Consistent Event Names**: Map legacy events to equivalent modern events
- **Context Preservation**: Maintain all event context (chainId, safeAddress, etc.)

## Testing Strategy: TEST-FIRST MIGRATION

### 1. Pre-Migration Event Audit & Mapping
```bash
# Find all GA-only events
yarn workspace @safe-global/web grep -r "trackEvent(" src/ --include="*.ts" --include="*.tsx"

# Find all Mixpanel-only events  
yarn workspace @safe-global/web grep -r "trackMixPanelEvent(" src/ --include="*.ts" --include="*.tsx"

# Find all legacy event constants
yarn workspace @safe-global/web grep -r "WALLET_EVENTS\|TX_EVENTS\|SAFE_EVENTS" src/ --include="*.ts" --include="*.tsx"
```

### 2. Migration Parity Test Suite (CREATE FIRST!)
```typescript
// apps/web/src/services/analytics/__tests__/migration-parity.test.ts
describe('Analytics Migration Parity', () => {
  let legacyAnalytics: any
  let modernAnalytics: any
  let mockGA: jest.MockedFunction<any>
  let mockMixpanel: jest.MockedFunction<any>

  beforeEach(() => {
    // Setup both old and new systems
    legacyAnalytics = { trackEvent, trackMixPanelEvent }
    modernAnalytics = useAnalytics()
    
    mockGA = jest.fn()
    mockMixpanel = jest.fn()
  })

  describe('GA-Only Events', () => {
    it('trackEvent should only send to GA', () => {
      // Legacy behavior
      legacyAnalytics.trackEvent({
        event: 'wallet_connect',
        category: 'wallet',
        action: 'connect'
      })
      
      expect(mockGA).toHaveBeenCalledTimes(1)
      expect(mockMixpanel).toHaveBeenCalledTimes(0)
    })

    it('track with excludeProviders should only send to GA', () => {
      // Modern equivalent
      modernAnalytics.track({
        name: EVENT.WalletConnected,
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...',
          chain_id: '1'
        }
      }, {
        excludeProviders: ['mixpanel']
      })
      
      expect(mockGA).toHaveBeenCalledTimes(1)
      expect(mockMixpanel).toHaveBeenCalledTimes(0)
    })

    it('should send identical payload structure', () => {
      // Compare exact payloads sent to GA
      const expectedPayload = {
        wallet_label: 'MetaMask',
        wallet_address: '0x123...',
        chain_id: '1'
      }
      
      // Test both legacy and modern send same data
      expect(mockGA).toHaveBeenCalledWith(
        expect.objectContaining(expectedPayload)
      )
    })
  })

  describe('Mixpanel-Only Events', () => {
    it('trackMixPanelEvent should only send to Mixpanel', () => {
      // Legacy behavior
      legacyAnalytics.trackMixPanelEvent('Safe App Launched', {
        'Safe App Name': 'Compound',
        'Safe App Tags': ['defi']
      })
      
      expect(mockGA).toHaveBeenCalledTimes(0)
      expect(mockMixpanel).toHaveBeenCalledTimes(1)
    })

    it('track with includeProviders should only send to Mixpanel', () => {
      // Modern equivalent  
      modernAnalytics.track({
        name: EVENT.SafeAppLaunched,
        payload: {
          app_name: 'Compound',
          app_url: 'https://compound.finance',
          category: 'defi',
          safe_address: '0x123...',
          chain_id: '1'
        }
      }, {
        includeProviders: ['mixpanel']
      })
      
      expect(mockGA).toHaveBeenCalledTimes(0)
      expect(mockMixpanel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Both Provider Events', () => {
    it('should send to both GA and Mixpanel by default', () => {
      modernAnalytics.track({
        name: EVENT.TransactionCreated,
        payload: {
          tx_type: 'transfer_token',
          safe_address: '0x123...',
          chain_id: '1'
        }
      })
      
      expect(mockGA).toHaveBeenCalledTimes(1)
      expect(mockMixpanel).toHaveBeenCalledTimes(1)
    })
  })
})
```

### 3. Provider Routing Tests
```typescript
describe('Provider Routing', () => {
  it('should respect includeProviders option', () => {
    track(testEvent, { includeProviders: ['ga'] })
    expect(mockGA).toHaveBeenCalled()
    expect(mockMixpanel).not.toHaveBeenCalled()
  })

  it('should respect excludeProviders option', () => {
    track(testEvent, { excludeProviders: ['mixpanel'] })
    expect(mockGA).toHaveBeenCalled()
    expect(mockMixpanel).not.toHaveBeenCalled()
  })
})
```

### 4. Legacy vs Modern Payload Validation
```typescript
describe('Payload Structure Validation', () => {
  // Test that modern system produces identical payloads to legacy system
  const testCases = [
    {
      legacy: { event: 'wallet_connect', category: 'wallet' },
      modern: { name: EVENT.WalletConnected, payload: { wallet_label: 'MetaMask' } },
      expectedGA: { /* expected GA payload */ },
      expectedMixpanel: { /* expected Mixpanel payload */ }
    }
    // ... all other events
  ]

  testCases.forEach(testCase => {
    it(`should produce identical payloads for ${testCase.legacy.event}`, () => {
      // Test implementation
    })
  })
})
```

### 5. Integration Tests
- [ ] Test all major user flows (wallet connection, transactions, safe creation)
- [ ] Verify analytics events are sent during Cypress E2E tests
- [ ] Cross-browser validation (Chrome, Firefox, Safari)

## Migration Execution Plan

### Phase 1: Preparation & Setup
1. **Legacy Event Audit**
   ```bash
   # Find all legacy analytics calls
   find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "trackEvent"
   ```

2. **Expand Event Catalog** 
   - Add missing events to `events/catalog.ts`
   - Ensure all legacy events have modern equivalents
   - Add proper Zod schemas for validation

3. **Provider Enhancement**
   - Remove MixpanelProvider whitelist restrictions
   - Simplify GoogleAnalyticsProvider (remove GTM wrapper)
   - Test providers work with all event types

### Phase 2: Mass Component Migration
1. **Automated Migration Script**
   ```bash
   # Replace imports
   find apps/web/src -name "*.ts" -o -name "*.tsx" -exec sed -i 's/trackEvent/useAnalytics/g' {} +
   
   # Update event constants  
   find apps/web/src -name "*.ts" -o -name "*.tsx" -exec sed -i 's/WALLET_EVENTS\.CONNECT/EVENT.WalletConnected/g' {} +
   ```

2. **Manual Refinement**
   - Convert event payloads to modern format
   - Add proper TypeScript types
   - Ensure useAnalytics hook integration

### Phase 3: Legacy Code Removal
1. **Delete Legacy Files**
   ```bash
   rm apps/web/src/services/analytics/gtm.ts
   rm apps/web/src/services/analytics/mixpanel.ts
   rm -rf apps/web/src/services/analytics/events/
   ```

2. **Clean Up Exports**
   - Update `services/analytics/index.ts` 
   - Remove legacy function exports
   - Keep only new system exports

### Phase 4: Testing & Validation
1. **Build Verification**
   ```bash
   yarn workspace @safe-global/web build
   yarn workspace @safe-global/web typecheck
   yarn workspace @safe-global/web lint
   ```

2. **Test Suite**
   ```bash
   yarn workspace @safe-global/web test
   yarn workspace @safe-global/web test:coverage
   ```

3. **E2E Validation**
   ```bash
   yarn workspace @safe-global/web cypress:run
   ```

## Migration Checklist

### Core Tasks
- [ ] **Event Audit Complete** - All 358 `trackEvent` calls identified and mapped
- [ ] **Catalog Expansion** - All legacy events have modern EVENT equivalents  
- [ ] **Provider Updates** - Google Analytics and Mixpanel providers enhanced
- [ ] **Component Migration** - All 128 files updated to use `useAnalytics()`
- [ ] **Legacy Cleanup** - All old analytics code removed
- [ ] **Import Updates** - All analytics imports point to new system

### Quality Assurance  
- [ ] **TypeScript Build** - Zero compilation errors
- [ ] **Linting Passes** - All code style checks pass
- [ ] **Unit Tests** - All analytics tests updated and passing
- [ ] **Integration Tests** - E2E tests verify analytics functionality
- [ ] **Performance Check** - No regression in bundle size or runtime

### Pre-Merge Validation
- [ ] **Staging Deployment** - Migration tested in staging environment
- [ ] **Event Verification** - Confirm events reach GA4 and Mixpanel correctly  
- [ ] **User Flow Testing** - All critical flows tested end-to-end
- [ ] **Team Review** - Code review completed by analytics stakeholders

## Success Metrics

### Technical Success
- ✅ **Zero build errors** after migration
- ✅ **100% test coverage** maintained
- ✅ **No performance regression** (<5% bundle size increase)  
- ✅ **Type safety** - All events properly typed

### Analytics Success  
- ✅ **Event parity** - Same events sent before/after migration
- ✅ **Data continuity** - No interruption to analytics dashboards
- ✅ **Provider functionality** - Both GA4 and Mixpanel work correctly

### Team Success
- ✅ **Clean codebase** - No legacy analytics code remains
- ✅ **Developer experience** - New system easier to use than legacy
- ✅ **Documentation** - Migration approach documented for future reference

---

**Migration Approach**: Single comprehensive MR with complete legacy replacement  
**Timeline**: Complete migration in current feature branch  
**Rollback Plan**: Single MR revert restores entire legacy system