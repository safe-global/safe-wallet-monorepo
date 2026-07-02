Read @AGENTS.md for comprehensive guidelines on contributing to this repository.

## Code comments

Don't add comments. Let names carry the meaning. Only if truly needed: a short `TODO`, or a one-liner on _why_ a non-obvious workaround exists — never _what_ the code does.

## Design tokens

Never hardcode a hex value and never approximate a design color with a "close enough" token. If a design references a color/spacing/radius the theme doesn't expose, add the token: edit `packages/theme/src/palettes/{types,light,dark}.ts` (both light and dark), run `yarn workspace @safe-global/web css-vars`, then use the generated `var(--color-*)`. Never edit `apps/web/src/styles/vars.css` by hand.
