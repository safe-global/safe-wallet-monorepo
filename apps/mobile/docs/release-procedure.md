# Releasing to Production

The code is being actively developed on the `dev` branch. Pull requests are made against this branch.

When we want to make a release, we create a new branch from `dev` called `mobile-release/vX.Y.Z` where `X.Y.Z` is the
version number of the release.

This will trigger a new build on the CI/CD pipeline, which will build the app and submit it to the internal distribution
lanes in App Store and Google Play Store.

The release has to be tested by QA and once approved can be promoted to the production lane.

# Dev builds

Devs builds are being automatically created on every PR that touches files inside `apps/mobile` or `packages/*` folders.
Those builds are pushed to the internal distribution lanes in App Store and Google Play Store.

## Triggering Maestro E2E tests

Any PR that touches files inside `apps/mobile` or `packages/*` folders will trigger an e2e iOS test.
