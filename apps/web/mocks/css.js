module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '__esModule') return false
      return prop
    },
  },
)
