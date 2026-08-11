/**
 * CSS-module typings. apps/web gets these from `typescript-plugin-css-modules`, which is a
 * Next-specific tsconfig plugin; this package type-checks with plain `tsc`, so it declares
 * the module shape itself.
 *
 * Only `ChoiceButton` still carries a CSS module — everything else styles through Tailwind
 * utilities and `cn()`. Prefer that for anything new: a class name in the component is
 * visible to the design-system lint guards, a CSS module is not.
 */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
