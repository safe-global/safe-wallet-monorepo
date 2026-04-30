# Mobile App AI Contributor Guidelines

Mobile-specific guidance for the Expo/React Native app under `apps/mobile/`. For monorepo-wide rules (Turborepo, theme system, Workflow, regression checklist, Security, general principles), see the root [AGENTS.md](../../AGENTS.md).

## Mobile Development (Expo + Tamagui)

- **UI Components** – Use Tamagui components for styling and theming. Import from `tamagui` not React Native directly when possible.
- **Theme System** – Follow the custom theme configuration in `src/theme/tamagui.config.ts`. Use theme tokens like `$background`, `$primary`, etc.
- **Component Structure** – Follow container/presentation pattern. See [docs/code-style.md](docs/code-style.md) for detailed component organization.
- **Font Management** – Use the configured DM Sans font family. Custom icons go through `SafeFontIcon` component.
- **Expo Plugins** – Custom Expo config plugins are in the `expo-plugins/` directory.

## Mobile-specific testing

- **E2E**: see [docs/e2e-tests-guidelines.md](docs/e2e-tests-guidelines.md).
- Cross-cutting unit-test conventions (Redux state assertions, MSW, no `any` in tests, faker) live in the root [AGENTS.md](../../AGENTS.md).

## Mobile-specific common pitfalls

- **Hardcoding values** – Use Tamagui tokens, not hard-coded values.
- **Breaking shared code** – Edits to `packages/**` affect both web and mobile. See [packages/AGENTS.md](../../packages/AGENTS.md).
- **Modifying generated files** – Never manually edit auto-generated files in `packages/utils/src/types/contracts/` or `packages/store/src/gateway/AUTO_GENERATED/`. CI will fail if AUTO_GENERATED files don't match the schema.

## Code complexity

The code complexity guidelines (lookup tables, early returns, switch for type discrimination, function-length limits) in [../web/docs/code-style.md](../web/docs/code-style.md) apply equally to mobile. See also [docs/code-style.md](docs/code-style.md) for mobile-specific organisation.
