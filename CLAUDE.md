# Safe Wallet Monorepo

Yarn workspace with Next.js TypeScript web app and mobile app. Run commands from root directory.

## Commands (from root)
- **Dev**: `yarn workspace @safe-global/web dev`
- **Build**: `yarn workspace @safe-global/web build`
- **Lint**: `yarn workspace @safe-global/web lint`
- **Test**: `yarn workspace @safe-global/web test`
- **Web optimized**: `yarn workspace @safe-global/web lint:parallel`, `yarn workspace @safe-global/web lint:changed`, `yarn workspace @safe-global/web test:changed`

## Structure  
- `apps/web/` - Next.js web app
- `apps/mobile/` - Mobile app
- `packages/` - Shared libraries

## Rules
1. **Always use workspace commands** from root directory
2. **Test & lint after every change** as the last task. 
  - When working on web, run `yarn workspace @safe-global/web test:changed` first, make sure they pass, then make sure `yarn workspace @safe-global/web lint:changed` passes.
3. **Use :changed scripts** for web after modifications
4. **Only lint files you touched** - Never lint/change files out of scope

## Code Standards
- **Minimal changes only** - Change as little code as possible
- **Clean code principles**: SOLID, DRY, KISS, YAGNI
- **Use design patterns** when appropriate
- **Comments sparingly** - Only when name doesn't explain the intent