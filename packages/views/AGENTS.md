# Views package guidelines

`@safe-global/views` holds how the web app looks: the shadcn/ui primitives in `src/components/ui/`, the views that turn props into markup, and what they need to render. `apps/web` imports them as `@safe-global/views/<path inside src>`. It is web only; mobile does not use it.

## Rules

- **Only presentation lives here.** A file belongs in this package if a designer would edit it to change how something looks or reads: markup, styles, assets, UI text, and formatting a value for display. Code that decides what is true lives in the app, even when it is a pure function, and a view receives its result as props. That includes which state something is in, who may do what, what data means, and how API data maps to what is shown. To check: if changing the code could change what a user is allowed to do or what they are told is true, it does not belong here.
- **No imports from an app.** Production files must not import `@/…` (apps/web) or anything that holds hooks, store access, SDK calls or analytics. Data and callbacks come in through props. ESLint (`no-restricted-imports`) enforces this; tests and stories are exempt.
- Inside the package, import other package files as `@safe-global/views/…`.
- Assets the views render (SVGs, CSS modules) live in the package (`src/assets/`, next to the view). An SVG that the app also serves by URL stays in `apps/web/public` as well.
- shadcn primitives are managed with the shadcn CLI from `apps/web` (`components.json` points at this package); read `src/components/ui/README.md` before editing them by hand.

## Checks

The package has no test or Storybook setup of its own. Its tests and stories run in `apps/web` (jest `roots` and Storybook `stories` include `packages/views/src`) and may use apps/web test helpers.

```bash
yarn workspace @safe-global/views type-check   # production source only
yarn workspace @safe-global/views lint
yarn workspace @safe-global/web type-check     # also covers the package's tests and stories
yarn workspace @safe-global/web test packages/views
```
