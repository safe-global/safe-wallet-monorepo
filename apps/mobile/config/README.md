# Remote-config declaration (mobile)

`remote-config.json` declares the runtime feature flags the **mobile** app expects
in the Safe Config Service, scoped to the `MOBILE` service. Validated against
`remote-config.schema.json`.

Mobile declares only the `FEATURES` keys that mobile code reads. The sync test
`remote-config.test.ts` fails if `apps/mobile/src` reads a flag that is not declared,
if a declared flag is not read anywhere, or if the file is schema-invalid.

See [`apps/web/config/README.md`](../../web/config/README.md) for the field
reference and the "adding a flag" / reconcile workflow — they are identical, only
the service key (`MOBILE`) and the scanned source folder differ.
