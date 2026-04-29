# Yarn `resolutions` rationale

The root [`package.json`](../package.json) `resolutions` block forces specific
versions of transitive dependencies. Each entry has a reason — without one
it's impossible to tell, months later, whether a pin is still load-bearing
or safe to drop. Add a short note here whenever a new entry is added.

## Entries

- **`isows: 1.0.7`** — dedup the transitive version that ships under viem
  (1.0.6 → 1.0.7 is a maintenance bump, no CVE; the pin avoids two copies
  in the bundle when other packages resolve isows differently).

> When you add an entry to `resolutions`, add the matching line here in the
> same commit.
