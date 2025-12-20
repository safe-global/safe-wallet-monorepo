# @safe-global/shell-protocol

Shared communication protocol types for the Shell + Account App architecture.

This package provides type-safe message definitions for postMessage communication between the Shell app and the Account app (iframe).

## Contents

- **messages.ts** - Message type definitions for bidirectional communication
- **wallet-interface.ts** - Wallet state and interface types
- **constants.ts** - Protocol version and shared constants
- **index.ts** - Public exports

## Usage

```typescript
import { PROTOCOL_VERSION, type ShellToAccountMessage } from '@safe-global/shell-protocol'
```
