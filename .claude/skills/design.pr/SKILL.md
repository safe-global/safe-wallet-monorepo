---
name: design.pr
description: Make a design pull request — change styling, copy and presentational markup of the web app without touching behaviour, checked by scripts/design-check. Use when the user says "make a design PR", "design PR", "design change", or is a designer changing how the app looks.
argument-hint: '[what to change]'
---

# Design pull request

A design pull request changes how the web app **looks and reads**, never what it **does**. The `Design scope` workflow fails a design pull request that changes anything else. Run the same check locally after every change, so the person you work with never gets a red CI.

## You may

- Change Tailwind classes: `className`, the strings in `cn(...)`, `clsx(...)` and `cva(...)` variant tables.
- Change CSS: `apps/web/src/**/*.css` and `packages/theme/src/**/*.css`. Use theme tokens; no `url()` to other sites.
- Change visible text: JSX text, string props such as `title`, `placeholder`, `aria-label`, `alt`, and copy values (`title`, `description`, `label`, `features`, ...) in existing content objects.
- Change presentational props such as `variant` and `size` of `@/components/ui/*` components.
- Move, wrap, reorder or remove plain markup (`div`, `span`, `table`, headings, icons), and add new markup that only shows data the component already has, for example a table built with `items.map((item) => <tr key={item.id}>…</tr>)`.
- Add a new presentational component (`.tsx`) that only imports `react`, `@/components/ui/*`, `lucide-react`, `@/utils/cn`, `class-variance-authority`, `next/link`, `next/image`, images from `@/public/images/` and other new presentational components, and render it with data already in scope.
- Add new images under `apps/web/public/images/` and update Storybook snapshots (`__snapshots__/*.snap`).

## You may not

- Add, remove or change event handlers (`onClick`, `onChange`, ...), `href`, `disabled`, `value`, `type`, `data-testid` or spread props.
- Change code outside the JSX: hooks, state, conditions, functions, data, imports of logic modules.
- Remove an element that carries a handler, or render a component that has its own logic in a new place.
- Edit tests, hooks, services, the store, feature flags, analytics, config or anything outside `apps/web`.
- Add animations that need JavaScript (effects, timers, `requestAnimationFrame`). CSS transitions and Tailwind `animate-*` classes are fine.

If the design needs one of these, stop and tell the user: a developer has to make that part in a separate pull request.

## Steps

1. Start from the latest `dev`: `git fetch origin dev && git switch -c design/<short-topic> origin/dev`.
2. Make the change. Keep it small; one screen or component per pull request is easiest to review.
3. Run the check and fix every finding it prints:
   ```bash
   node scripts/design-check/index.cjs --base origin/dev
   ```
   A finding names the file and line and what is not allowed, for example `adds onClick={subscribe}`. Undo that part instead of working around it.
4. Look at the result in Storybook (`yarn workspace @safe-global/web storybook`) or the running app, and take a screenshot for the pull request.
5. Run `yarn prettier:fix`, commit, push, and open the pull request as a draft with the label `design`. Put the screenshot in the "Visual summary" section.
