# How to update Terms & Conditions

The Terms & Conditions and the Privacy Policy are published on the website, at https://safe.global/terms and
https://safe.global/privacy. The app only links to them.

To update the terms:

1. The legal team edits the Terms story (`legal/terms`) in Storyblok and updates its `last_updated` field. The website
   rebuilds automatically.
2. If the change is significant enough that users must accept the terms again, a developer bumps `version` and
   `lastUpdated` in `src/markdown/terms/version.js` in this repo.

`lastUpdated` in `version.js` is the date the cookie and terms banner displays. Nothing links it to the Storyblok
`last_updated` field, so keep the two in step by hand whenever you bump the version.

## How does this work?

We rely on the version number from `version.js`. When the Redux store is rehydrated, we check the version stored in
the store against the version in `version.js`. If they differ, we reset the accepted terms, forcing the user to accept
the new version.

For Cypress, `cypress.config.js` reads the version from `version.js` and passes it as the
`CURRENT_COOKIE_TERMS_VERSION` environment variable. The Playwright fixtures and the Jest tests import `version.js`
directly.
