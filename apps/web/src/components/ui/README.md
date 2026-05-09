# shadcn/ui Components

This directory contains UI components from [shadcn/ui](https://ui.shadcn.com/), a collection of re-usable components built with Radix UI and Tailwind CSS.

## ⚠️ Semi-Auto Generated Code

These components are **semi-auto generated** from shadcn/ui templates using the `shadcn` CLI:

```bash
npx shadcn@latest add <component-name>
```

The components are:

- Generated from upstream templates
- Customized for Safe Wallet's design system
- Not manually written from scratch
- May contain intentional code patterns that trigger linters/analyzers

## Code Quality Notes

**These files are excluded from CodeScene analysis** (`.codescene.yml`) because:

- Code duplication is inherent to the shadcn/ui component architecture
- Component complexity reflects upstream patterns, not local technical debt
- False positives from code health tools are expected and acceptable

## Usage

Import components from this directory:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

## Customization

While these are generated files, they can be customized as needed. However, be aware that:

- Updates from upstream may require manual merging
- Customizations should be documented in component files
- Consider creating wrapper components for heavy customizations

## Documentation

See individual component stories in `apps/web/src/components/ui/stories/` for usage examples.

For shadcn/ui documentation: https://ui.shadcn.com/docs
