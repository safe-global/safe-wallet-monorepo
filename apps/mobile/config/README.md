# Remote-config declaration (mobile)

`remote-config.json` declares the runtime feature flags the **mobile** app expects
in the Safe Config Service, scoped to the `MOBILE` service. Validated against
`remote-config.schema.json`.

Mobile declares a **subset** of the shared `FEATURES` enum — only the keys mobile
actually uses (via `useHasFeature` / `hasFeature`). The sync test
`remote-config.test.ts` therefore asserts that every declared key is a valid
`FEATURES` value (not that every `FEATURES` value is declared).

See [`apps/web/config/README.md`](../../../web/config/README.md) for the field
reference and the "adding a flag" / reconcile workflow — they are identical, only
the service key (`MOBILE`) and the enum-subset rule differ.
