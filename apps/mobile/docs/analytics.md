# Mobile Analytics Service

This document explains how analytics are implemented in the Safe{Wallet} mobile app using Firebase Analytics, designed to match the Google Analytics implementation in the web app.

## Overview

The mobile analytics service provides:

- Automatic tracking of common parameters with every event
- Structured event tracking for key user actions
- Screen view tracking
- User property management
- Firebase Analytics integration

## Architecture

The analytics service consists of several modules:

### Core Service (`firebaseAnalytics.ts`)

- Handles Firebase Analytics integration
- Manages common parameters (appVersion, chainId, deviceType, safeAddress)
- Provides functions for tracking events, setting user properties, and managing analytics state

### Types (`types.ts`)

- Defines TypeScript interfaces and enums
- Includes event types, device types, transaction types, and user properties

### Events (`events/`)

- Modular event definitions organized by category
- Helper functions for creating events with specific labels

### Redux Middleware (`store/middleware/analytics/`)

We use the **Strategy Pattern** to easily subscribe to more redux events and in response to them dispatch analytics events

### Hooks

- `useAnalytics.ts`: Manages analytics context and common parameters
- `useScreenTracking.ts`: Tracks screen views automatically

## Usage

### Analytics Enablement

Analytics are **enabled by user consent** in the GetStarted screen when users first interact with the app:

```typescript
// In GetStarted screen
import { setAnalyticsCollectionEnabled } from '@/src/services/analytics'

const enableCrashlytics = async () => {
  await getCrashlytics().setCrashlyticsCollectionEnabled(true)
  await setAnalyticsCollectionEnabled(true) // User consents to analytics
}
```

### Basic Setup

The analytics system is automatically set up and requires minimal configuration:

1. **Global Setup**: The `useAnalytics()` hook is called in `_layout.tsx` to manage global analytics state
2. **Redux Middleware**: We prefer to use the redux middleware to track actions such as safe_open, signing txs etc
3. **Manual Tracking**: Use `trackEvent` for any additional manual tracking needs

### Manual Event Tracking

Import and use the `trackEvent` function:

```typescript
import { trackEvent, OVERVIEW_EVENTS } from '@/src/services/analytics'

// Track a simple event
await trackEvent(OVERVIEW_EVENTS.SAFE_VIEWED)
```

### Redux middleware Tracking

Most events should be tracked via Redux middleware.

### Managing User Properties

Set user properties for analytics segmentation:

```typescript
import { setUserProperty, AnalyticsUserProperties } from '@/src/services/analytics'

// Set wallet information
await setUserProperty(AnalyticsUserProperties.WALLET_LABEL, 'MetaMask')
await setUserProperty(AnalyticsUserProperties.WALLET_ADDRESS, 'abcd1234...') // without 0x prefix
```

### Component Usage

```typescript
// In any component that displays safe information
const SafeComponent = () => {

  const handleTransaction = async () => {
    await trackEvent(createTxConfirmEvent(TX_TYPES.transfer_token))
    // Automatically includes correct safeAddress and chainId
  }

  return <SafeDetails address={safeAddress} onTransaction={handleTransaction} />
}
```

## Event Structure

### Common Parameters

Every event automatically includes:

- `appVersion`: Current app version from package.json
- `chainId`: Current blockchain network ID from activeSafe or route params
- `deviceType`: 'ios' or 'android'
- `safeAddress`: Current safe address from activeSafe or route params (without 0x prefix)

### Event Parameters

Each tracked event includes:

- `eventName`: Firebase Analytics event name
- `eventCategory`: Categorizes the event (e.g., 'overview', 'transactions')
- `eventAction`: Describes the action (e.g., 'Safe viewed', 'Confirm transaction')
- `eventLabel`: Optional label for additional context (e.g., transaction type)

## Development

### Adding New Events

1. Define event constants in the appropriate events file:

```typescript
// events/newCategory.ts
export const NEW_CATEGORY_EVENTS = {
  NEW_ACTION: {
    eventName: EventType.NEW_EVENT,
    eventCategory: 'new-category',
    eventAction: 'New action',
  },
}
```

2. Export from `events/index.ts`:

```typescript
export * from './newCategory'
```

3. Use in components:

```typescript
import { trackEvent, NEW_CATEGORY_EVENTS } from '@/src/services/analytics'

const MyComponent = () => {

  const handleAction = async () => {
    await trackEvent(NEW_CATEGORY_EVENTS.NEW_ACTION)
  }

  return <Button onPress={handleAction} />
}
```

### Testing

Analytics events are logged to console in development mode. Use Firebase Analytics DebugView for real-time event monitoring during development (https://firebase.google.com/docs/analytics/debugview).
