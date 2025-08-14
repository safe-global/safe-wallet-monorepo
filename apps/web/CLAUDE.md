# Safe Wallet Web App

Next.js TypeScript application in a Yarn monorepo. Uses Jest for testing, ESLint for linting.

## Commands
- **Dev**: `yarn dev`
- **Build**: `yarn build`
- **Lint**: `yarn lint` or `yarn lint:parallel`
- **Test**: `yarn test`
- **After changes**: `yarn lint:changed && yarn test:changed`

## Structure
- `src/` - Source code
- `src/features/` - Feature modules
- `src/components/` - Reusable components

## Rules
1. **Always use `yarn`** - Never use `npx` or direct commands
2. **Test & lint after every change** as the last task
3. **Use `:changed` scripts** after modifications to run only affected files
4. **Only lint files you touched** - Never lint/change files out of scope

## Code Standards
- **Minimal changes only** - Change as little code as possible
- **Clean code principles**: SOLID, DRY, KISS, YAGNI
- **Use design patterns** when appropriate
- **Comments sparingly** - Only when name doesn't explain the intent