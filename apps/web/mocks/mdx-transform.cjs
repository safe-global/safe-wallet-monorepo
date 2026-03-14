/** Jest transform that returns a no-op React component for MDX files. */
module.exports = {
  process() {
    return {
      code: `
        const { createElement } = require('react');
        function MdxContent() { return createElement('div', null, 'mdx-mock'); }
        MdxContent.metadata = {};
        module.exports = MdxContent;
        module.exports.default = MdxContent;
        module.exports.metadata = {};
      `,
    }
  },
}
