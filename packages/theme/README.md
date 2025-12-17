# @safe-global/theme

Unified theme package for Safe Wallet web and mobile applications.

## Overview

This package provides a single source of truth for all design tokens (colors, spacing, typography, etc.) used across the Safe Wallet monorepo. It exports platform-specific theme generators for:

- **Web**: MUI themes and CSS custom properties
- **Mobile**: Tamagui tokens and themes

## Installation

This is a workspace package used internally by the monorepo:

```json
{
  "dependencies": {
    "@safe-global/theme": "workspace:^"
  }
}
```

## Usage

### Web (MUI + CSS vars)

```typescript
import { generateMuiTheme, lightPalette, darkPalette } from '@safe-global/theme'

const theme = generateMuiTheme('light', lightPalette)
```

### Mobile (Tamagui)

```typescript
import { generateTamaguiTokens, generateTamaguiThemes, lightPalette, darkPalette } from '@safe-global/theme'

const tokens = generateTamaguiTokens(lightPalette, darkPalette)
const themes = generateTamaguiThemes(lightPalette, darkPalette)
```

### Direct Token Access

```typescript
import { spacingMobile, spacingWeb, radius, typography } from '@safe-global/theme/tokens'
```

## Design Tokens

### Colors

Unified color palette with light and dark modes:
- Semantic colors: text, primary, secondary, border, error, success, info, warning
- Background colors with variants
- Static colors (theme-independent)

### Spacing

Two spacing systems for platform compatibility:
- **Mobile**: 4px base ($1=4px, $2=8px, $3=12px, ...)
- **Web**: 8px base (space-1=8px, space-2=16px, space-3=24px, ...)
- Where values overlap, same variable name is used

### Typography

- Font family: DM Sans
- Font sizes: 1-16 (11px to 134px)
- Typography variants: h1-h5, body1/body2, caption, overline

### Border Radius

Radius scale from 0-12 (0px to 50px)

## Development

```bash
# Run tests
yarn test

# Type check
yarn type-check

# Lint
yarn lint
yarn lint:fix

# Format
yarn prettier
yarn prettier:fix
```

## Architecture

- `src/palettes/` - Color palette definitions
- `src/tokens/` - Design token definitions (spacing, typography, etc.)
- `src/generators/` - Platform-specific theme generators
- `src/utils/` - Utility functions

For more details, see the implementation plan and source code.
