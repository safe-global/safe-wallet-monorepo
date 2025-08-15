# Safe Wallet Monorepo

Yarn workspace with Next.js TypeScript web app and mobile app. Run commands from root directory.

## Commands (from root)
- **Dev**: `yarn workspace @safe-global/web dev`
- **Build**: `yarn workspace @safe-global/web build`
- **Lint**: `yarn workspace @safe-global/web lint`
- **Test**: `yarn workspace @safe-global/web test`

### Web Optimized Commands (Always Use These When Working on Web)
- **Parallel lint**: `yarn workspace @safe-global/web lint:parallel`
- **Changed files lint**: `yarn workspace @safe-global/web lint:changed` 
- **Changed files test**: `yarn workspace @safe-global/web test:changed`

## Structure  
- `apps/web/` - Next.js web app
- `apps/mobile/` - Mobile app
- `packages/` - Shared libraries

## Rules
1. **Always use workspace commands** from root directory
2. **Required final task sequence** - Complete EVERY task with these steps in order:
   - **Step 1**: Check for unused functions, methods, or code - delete any unused code
   - **Step 2**: Run tests (on web use `yarn workspace @safe-global/web test:changed`) and ensure tests pass
   - **Step 3**: Run (on web use `yarn workspace @safe-global/web lint:changed`) and ensure linting passes
3. **Only lint/test files you touched** - Never lint/change files out of scope

## Code Standards
- **Minimal changes only** - Change as little code as possible
- **Clean code principles**: SOLID, DRY, KISS, YAGNI
- **Use design patterns** when appropriate
- **Comments sparingly** - Only when name doesn't explain the intent