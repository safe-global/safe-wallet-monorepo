# Views (`storybook/src`)

Everything a user of the web app sees is rendered by a **view** in this folder. Business logic lives in a **container** in `apps/web/src` that passes data and callbacks to the view as props. A designer can change any view without touching business logic.

## Rules

1. **A view only renders.** It may use React state, effects and memo for presentation (open/closed, hover, a local input value). It may not use the Redux store, RTK Query, `next/router`, wallets, viem/ethers, `react-hook-form`, `fetch`, `window`, `document`, `localStorage` or timers. Data and actions come in as props.
2. **A view imports only** other views, assets, and what `apps/web/sandbox/policy.json` (plus `policy.d/*.json`) allows. The build runs every view in an SES compartment and fails on any other import.
3. **A container renders no markup.** No host elements (`<div>`), no `className`/`style`, no visible text, no copy in string attributes (`placeholder`, `aria-label`, `title`), and no design-system primitives from `@/components/ui`. It renders views, other containers, providers and widgets.
4. **Widgets** (`widgets` in the policy) are containers that a view may render, such as `Track`. A view sets their props but cannot change what they do.

Check both sides with:

```bash
node apps/web/sandbox/check-views.cjs <files...>   # or --all
```

## Splitting a component

A component at `apps/web/src/<dir>/<Name>.tsx` (or `<dir>/index.tsx`) that has both logic and markup becomes:

- **View** `storybook/src/<dir>/<Name>View.tsx` exporting `<Name>View` and `<Name>ViewProps`. For `index.tsx`, use the folder name: `storybook/src/<dir>/<Folder>View.tsx`.
- **Container** stays at the original path with the original exports and props, so no caller changes. It calls the hooks, computes values and handlers, and renders `<NameView … />`, importing it from `@views/<dir>/<Name>View`.

Keep the markup, classes and copy exactly as they were. The rendered DOM must not change.

A component with no logic at all moves as a whole: `git mv` it (and its colocated test, story and styles) to the same path under `storybook/src`. `@/` resolves `apps/web/src` first and `storybook/src` second, so imports by `@/` path keep working. Relative imports that cross the boundary must become `@/` (from a view) or `@views/` (from `apps/web`).

### Passing things in

- **Values:** plain props (`isLoading`, `balance`, `href`).
- **Actions:** callbacks (`onSubmit`, `onClose`). The container wraps tracking and business calls in them.
- **Another container inside a view:** pass it as a `ReactNode` slot prop (`actions`, `addressSlot`), or list it as a widget if many views need it and it is self-contained.
- **Form fields (`react-hook-form`):** the container calls `register(...)` and passes the result as a prop. The view spreads it onto the input.
- **Text that depends on data** is built in the view from values (`{count} owners`), not in the container.

Class components are rewritten as function components, except error boundaries, which stay classes and pass their fallback UI to a view.
