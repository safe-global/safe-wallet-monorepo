# AI Contributor Guidelines

**📖 Read @AGENTS.md for comprehensive guidelines on contributing to this repository.**

## 🚨 Critical Git Workflow Rules

**NEVER push directly to `dev` (default branch) or `main` (production branch).**

Always create a feature branch and submit a pull request:

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and ALWAYS run checks before committing
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test

# ALWAYS run prettier before committing — CI will reject unformatted code
yarn prettier:fix

# Commit only after ALL checks pass (including prettier)
git add .
git commit -m "feat: your change description"

# Semantic commit prefixes:
# - feat: new features
# - fix: bug fixes
# - chore: CI/CD, build, config changes (NEVER use feat/fix for CI)
# - tests: changes in unit or e2e tests (NEVER use feat/fix for tests)
# - refactor: code refactoring
# - docs: documentation

# Push to your branch
git push -u origin feature/your-feature-name

# Create a PR via GitHub UI or gh CLI
gh pr create
```

**All checks must pass before committing. Never commit failing code.**
**ALWAYS run `yarn prettier:fix` before staging and committing. Prettier failures block CI.**

Use `@AGENTS.md` in your prompts to include the full guidelines, which cover:

- Quick start commands
- Architecture overview
- Workflow and testing guidelines
- Storybook usage
- Security and Safe-specific patterns
- Common pitfalls and debugging tips

## Active Technologies

- TypeScript 5.x (Next.js 14.x) + Storybook 10.x, MSW 2.x, Chromatic, @storybook/nextjs, shadcn/ui (001-shadcn-storybook-migration)
- N/A (tooling/documentation feature) (001-shadcn-storybook-migration)

- TypeScript 5.x (Next.js 14.x) + Next.js (dynamic imports), ESLint (import restrictions), Redux Toolkit (state management) (001-feature-architecture)
- N/A (architecture pattern, no new data storage) (001-feature-architecture)

## Recent Changes

- 001-feature-architecture: Added TypeScript 5.x (Next.js 14.x) + Next.js (dynamic imports), ESLint (import restrictions), Redux Toolkit (state management)
