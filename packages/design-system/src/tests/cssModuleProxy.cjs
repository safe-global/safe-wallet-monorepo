/**
 * CSS-module stand-in for Jest: returns the class name you ask for.
 *
 * The shared jest preset maps every stylesheet to `jest-transform-stub`, which returns an empty
 * object — so `styles.txButton` becomes `undefined` and the class disappears from the rendered
 * markup. apps/web doesn't hit this because `next/jest` installs its own identity proxy; this is the
 * plain-Jest equivalent, so story snapshots record the same class names the app renders.
 */
module.exports = new Proxy(
  {},
  {
    get: (_target, key) => (key === '__esModule' ? false : key),
  },
)
