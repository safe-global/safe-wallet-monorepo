/**
 * Hermes's implementation of Intl is not up to date and is missing some features. We rely mainly on `notation: "compact"`
 * to properly format currency values, but it is not supported in Hermes.
 * https://github.com/facebook/hermes/blob/5911e8180796d3ccb2669237ca441da717ad00b2/doc/IntlAPIs.md#limited-ios-property-support
 *
 * We need to polyfill some Intl APIs to make it work, and it seems that formatjs is doing the trick for us
 */

// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577

// https://github.com/formatjs/formatjs/blob/main/packages/intl-getcanonicallocales/polyfill-force.ts
import '@formatjs/intl-getcanonicallocales/polyfill-force'
// https://github.com/formatjs/formatjs/blob/main/packages/intl-locale/polyfill-force.ts
import '@formatjs/intl-locale/polyfill-force'
// https://github.com/formatjs/formatjs/blob/main/packages/intl-pluralrules/polyfill-force.ts
import '@formatjs/intl-pluralrules/polyfill-force'
// https://github.com/formatjs/formatjs/blob/main/packages/intl-numberformat/polyfill-force.ts
import '@formatjs/intl-numberformat/polyfill-force'

import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en'
