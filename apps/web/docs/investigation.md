# WalletConnect Investigation Summary

## Current State

- **2 commits ago** (df778b32e): Working ✅

- **1 commit ago** (fb5ad724e): Unknown status ❓

- **Current commit** (4a54c2fc2): Broken - loading circle, no QR modal ❌

## Two Separate WalletConnect Implementations

### 1. Wallet-to-Safe Connection (`@web3-onboard/walletconnect`)

- **Purpose:** Connect wallet (Tangem/Ledger) TO Safe on homepage

- **Location:** `@web3-onboard/walletconnect` npm package

- **Used:** Homepage wallet connection flow

- **Initialization:** Managed by web3-onboard internally

### 2. Safe-to-dApp Connection (`features/walletconnect`)

- **Purpose:** Connect Safe TO external dApps (Uniswap, etc)

- **Location:** `apps/web/src/features/walletconnect/`

- **Used:** After Safe is loaded, WalletConnect widget in header

- **Initialization:** `WalletConnectContext.tsx` + `WalletConnectWallet.ts`

## The Global Core Singleton Problem

### Key Discovery

```typescript
// WalletConnect Core uses GLOBAL singleton pattern

// Both implementations share the same global Core instance

// If both initialize → collision error
```

### Evidence

- Error: `"WalletConnect Core is already initialized. Init() was called 3 times"`

- Both implementations call `Core.init()` independently

- Second init() call throws warning and causes unpredictable behavior

**Stack trace shows:** `walletConnect.js:77` → This is @web3-onboard retrying 3 times!

## Storage Namespace Collision

**Problem:** Both implementations used same localStorage keys

**Solution Applied:** Added prefix `LS_NAMESPACE + 'wc_dapp_'` to Safe-to-dApp implementation

**Status:** Fixed in commit df778b32e ✅

## Changes Made Across Commits

### df778b32e (Storage prefix) - WORKING ✅

```typescript

// WalletConnectWallet.ts

storage: window.localStorage,

storageOptions: {

database: LS_NAMESPACE + 'wc_dapp_', // Added prefix

}

```

### fb5ad724e (Lazy initialization) - STATUS UNKNOWN ❓

```typescript
// WalletConnectContext.tsx

useEffect(() => {
  // Changed from: useEffect([], ...)

  // To: useEffect([chainId, safeAddress], ...)

  if (chainId && safeAddress) {
    walletConnect.init()
  }
}, [chainId, safeAddress]) // Only init when Safe exists
```

### 4a54c2fc2 (Complete isolation) - BROKEN ❌

```typescript

// Header.tsx

{enableWc && safeAddress && ( // Added safeAddress check

<WalletConnect />

)}



// Removed eth_getCode fallback from SafeWalletProvider

```

## Current Symptoms

### What happens:

1. Click "Connect Wallet"

2. Select "WalletConnect"

3. Loading circle appears (spinner)

4. QR modal never shows

5. Console errors:

- `CodedException: Code 705: Failed to read from IndexedDB`

- `WalletConnect Core is already initialized... Init() was called 3 times`

### IndexedDB Errors

```

useNotificationPreferences.ts:146 - hydratePreferences() failing

useNotificationPreferences.ts:120 - hydrateUuidStore() failing

Error: Internal error opening backing store for indexedDB.open()

```

## Root Cause Analysis

### Theory 1: IndexedDB Corruption Causing Retries

- Push notifications feature trying to access IndexedDB

- Browser-level corruption (not our code)

- @web3-onboard fails → retries → creates multiple Core instances

- **Evidence:** User cleared localStorage but still seeing errors

- **Implication:** IndexedDB ≠ localStorage, needs separate clearing

### Theory 2: Lazy Init Caused Re-initialization

- Commit fb5ad724e changed init to depend on `[chainId, safeAddress]`

- If these values change during render, re-init happens

- Could cause Core to init multiple times

- **Question:** Does chainId/safeAddress change during initial page load?

### Theory 3: Conditional Rendering Broke Something

- Latest commit prevents WalletConnectProvider from rendering on homepage

- This is CORRECT for Safe-to-dApp

- But could something else depend on it?

- **Question:** Is there a dependency expecting WalletConnectProvider to always exist?

### Theory 4: @web3-onboard Using Stale Core

- Our Safe-to-dApp WalletConnect created Core in previous session

- @web3-onboard trying to use same global Core

- Storage cleared but Core singleton persists in memory?

- **Question:** Does page refresh clear the global Core?

## Key Questions to Answer

1. **What specifically broke between df778b32e and fb5ad724e?**

- Test commit fb5ad724e to isolate the issue

2. **Is IndexedDB corruption browser-specific?**

- Try different browser/incognito mode

- Try on different machine

3. **Does @web3-onboard expect certain localStorage keys?**

- Could our prefix change affect @web3-onboard?

- Check @web3-onboard source for storage expectations

4. **Are chainId/safeAddress changing unexpectedly on homepage?**

- Add logging to see if lazy init is firing

- Homepage should have no Safe → should NOT init

5. **Why is IndexedDB failing?**

- Browser permissions issue?

- Disk space issue?

- Browser security policy?

## Next Steps (Need Confirmation)

### Option A: Revert to last working commit

```bash

git checkout df778b32e

# Test wallet connection

# Confirm it works

```

### Option B: Test intermediate commit

```bash

git checkout fb5ad724e

# Test wallet connection

# Determine if lazy init broke it

```

### Option C: Fix IndexedDB errors first

- Add try-catch in useNotificationPreferences

- Prevent IndexedDB errors from blocking app

- Let wallet connection proceed

### Option D: Investigate @web3-onboard initialization

- Check if @web3-onboard is affected by our storage prefix

- Check if it's creating its own Core instance properly

## What We Need From User

1. Which option to pursue? (Revert, test, or fix forward)

2. Can you test in incognito mode? (Bypass IndexedDB corruption)

3. Can you test df778b32e commit? (Confirm it actually works)

4. Any other symptoms or clues?

## Important Files

- `apps/web/src/features/walletconnect/WalletConnectContext.tsx` - Safe-to-dApp initialization

- `apps/web/src/features/walletconnect/services/WalletConnectWallet.ts` - Core singleton & storage

- `apps/web/src/components/common/Header/index.tsx` - Conditional rendering

- `apps/web/src/services/safe-wallet-provider/index.ts` - eth_getCode fallback (removed)

- `apps/web/src/components/settings/PushNotifications/hooks/useNotificationPreferences.ts` - IndexedDB errors

## Timeline

```

aba25e0db - cleaning logging statements

↓

b6edd57ef - clean up code and documentation (added eth_getCode for XDC)

↓

df778b32e - fix: prevent WalletConnect localStorage collision ✅ WORKING

↓

fb5ad724e - fix: lazy initialize Safe-to-dApp WalletConnect ❓ UNKNOWN STATUS

↓

4a54c2fc2 - fix: complete isolation ❌ BROKEN (loading circle, no QR)

```

## Core Singleton Documentation

From `WalletConnectWallet.ts`:

```typescript
/**

* CRITICAL: WalletConnect Core uses a GLOBAL singleton pattern.

*

* The @walletconnect/core package maintains a global registry of Core instances.

* When you call new Core(), it checks if an instance with the same projectId

* already exists and returns that instead of creating a new one.

*

* PROBLEM:

* - Wallet-to-Safe: @web3-onboard/walletconnect creates its own Core instance

* - Safe-to-dApp: features/walletconnect creates another Core instance

* - Both use the SAME projectId → collision!

*

* SOLUTION:

* 1. Storage isolation: Use different storageOptions.database prefix

* 2. Lazy initialization: Only init Safe-to-dApp when Safe exists

* 3. Conditional rendering: Don't mount WalletConnectProvider without Safe

*

* This ensures Wallet-to-Safe connections work on homepage without interference.

*/
```

## Commit Messages

### df778b32e - Storage Prefix

```

fix(web): prevent WalletConnect localStorage collision



Added 'wc_dapp_' prefix to Safe-to-dApp WalletConnect storage to prevent

collision with @web3-onboard/walletconnect wallet connection flow.

```

### fb5ad724e - Lazy Initialization

```

fix(web): lazy initialize Safe-to-dApp WalletConnect to prevent wallet connection interference



Changed initialization to only occur when Safe context (chainId + safeAddress) exists.

Added safety check in approveSession to prevent invalid sessions.

```

### 4a54c2fc2 - Complete Isolation

```

fix(web): complete isolation of wallet-to-Safe from Safe-to-dApp WalletConnect



THREE-LAYER SOLUTION:



1. Conditional Rendering (Header.tsx)

- Only render WalletConnect widget when Safe exists



2. Remove eth_getCode Fallback (SafeWalletProvider)

- The XDC network fix was redirecting EOA → Safe address

- This broke wallet connections on homepage



3. Keep Lazy Init (from previous commit)

- WalletConnect only initializes when Safe is loaded

```
