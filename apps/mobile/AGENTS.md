# Mobile App AI Contributor Guidelines

Mobile-specific guidance for the Expo/React Native app under `apps/mobile/`. For monorepo-wide rules (Turborepo, theme system, Workflow, regression checklist, Security), see the root [AGENTS.md](../../AGENTS.md).

## Mobile Development (Expo + Tamagui)

- **UI Components** – Use Tamagui components for styling and theming. Import from `tamagui` not React Native directly when possible.
- **Theme System** – Follow the custom theme configuration in `src/theme/tamagui.config.ts`. Use theme tokens like `$background`, `$primary`, etc.
- **Component Structure** – Follow container/presentation pattern. See [docs/code-style.md](docs/code-style.md) for detailed component organization.
- **Font Management** – Use the configured DM Sans font family. Custom icons go through `SafeFontIcon` component.
- **Expo Plugins** – Custom Expo config plugins are in the `expo-plugins/` directory.

## Non-obvious commands

```bash
yarn workspace @safe-global/mobile generate:icons  # required after adding an icon for SafeFontIcon
yarn workspace @safe-global/mobile e2e:metro-ios   # then e2e:run (Maestro E2E, two steps)
yarn workspace @safe-global/mobile storybook:ios   # also storybook:android, storybook:web
```

Standard scripts (`test`, `test:watch`, `lint`, `type-check`, …) follow the usual names in `package.json`.

## Navigation (Expo Router)

`src/app/` is file-based routing with route groups — `(tabs)`, `(send)`, `(import-accounts)` — and modal sheets named `*-sheet.tsx`. Add screens as route files following the nearest group's conventions.

## Mobile-specific testing

- **Unit tests**: use `src/tests/test-utils.tsx` (custom render with providers), factories in `src/tests/factories/`, and the MSW server in `src/tests/server.ts` — don't hand-roll provider wrappers.
- **E2E (Maestro)**: operational quick-start in [e2e/README.md](e2e/README.md); guidelines in [docs/e2e-tests-guidelines.md](docs/e2e-tests-guidelines.md).
- Cross-cutting unit-test conventions (Redux state assertions, MSW, no `any` in tests, faker) live in the root [AGENTS.md](../../AGENTS.md).

## Mobile-specific common pitfalls

- **Hardcoding values** – Use Tamagui tokens, not hard-coded values.
- **Shared code** – Edits to `packages/**` affect both platforms and are NOT covered by app verify scripts — see [packages/AGENTS.md](../../packages/AGENTS.md).

## Code complexity

The code complexity guidelines (lookup tables, early returns, switch for type discrimination, function-length limits) in [../web/docs/code-style.md](../web/docs/code-style.md) apply equally to mobile. See also [docs/code-style.md](docs/code-style.md) for mobile-specific organisation.

Other mobile docs: [docs/](docs/) covers analytics, push notifications, and the release procedure.
