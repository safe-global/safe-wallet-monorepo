/**
 * Keeps the split between containers (apps/web/src) and views (storybook/src): a container renders
 * no markup, styling or copy of its own. See storybook/AGENTS.md.
 */

import { readFileSync } from 'node:fs'

const { widgets: WIDGETS } = JSON.parse(readFileSync(new URL('../sandbox/policy.json', import.meta.url), 'utf8'))
const HEAD_TAGS = new Set(['title', 'meta', 'link'])
const STYLE_PROPS = new Set(['className', 'style', 'sx'])
const NON_COPY_PROPS = /^(key|id|name|href|type|target|rel|role|autoComplete|inputMode|data-.*|testId)$/

const jsxName = (node) => {
  if (node.type === 'JSXIdentifier') return node.name
  if (node.type === 'JSXMemberExpression') return `${jsxName(node.object)}.${jsxName(node.property)}`
  if (node.type === 'JSXNamespacedName') return `${node.namespace.name}:${node.name.name}`
  return ''
}

/** @type {import('eslint').Rule.RuleModule} */
const noMarkupInContainers = {
  meta: {
    type: 'problem',
    docs: { description: 'Containers in apps/web render views only; markup, styling and copy belong in storybook/src' },
    schema: [],
    messages: {
      hostElement:
        'Container renders <{{tag}}>. Move the markup into a view in storybook/src (see storybook/AGENTS.md).',
      styling: 'Container sets {{prop}}. Styling belongs in a view in storybook/src (see storybook/AGENTS.md).',
      copy: 'Container renders the text "{{text}}". Copy belongs in a view in storybook/src (see storybook/AGENTS.md).',
      copyProp:
        'Container sets {{prop}}="{{text}}". Copy and variants belong in a view in storybook/src (see storybook/AGENTS.md).',
      primitive:
        'Container imports the design-system primitive "{{source}}". Render it from a view in storybook/src (see storybook/AGENTS.md).',
    },
  },
  create(context) {
    const insideHeadTag = (node) =>
      node.parent?.type === 'JSXElement' && HEAD_TAGS.has(jsxName(node.parent.openingElement.name))

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (node.importKind === 'type') return
        if (
          source.startsWith('@/components/ui/') &&
          source !== '@/components/ui/ShadcnProvider' &&
          !WIDGETS.includes(source)
        )
          context.report({ node, messageId: 'primitive', data: { source } })
      },
      JSXOpeningElement(node) {
        const tag = jsxName(node.name)
        if (/^[a-z][\w-]*$/.test(tag) && !HEAD_TAGS.has(tag))
          context.report({ node, messageId: 'hostElement', data: { tag } })
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute') continue
          const prop = jsxName(attr.name)
          if (STYLE_PROPS.has(prop)) context.report({ node: attr, messageId: 'styling', data: { prop } })
          else if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string' && !NON_COPY_PROPS.test(prop))
            context.report({ node: attr, messageId: 'copyProp', data: { prop, text: attr.value.value.slice(0, 30) } })
        }
      },
      JSXText(node) {
        if (node.value.trim() && !insideHeadTag(node))
          context.report({ node, messageId: 'copy', data: { text: node.value.trim().slice(0, 40) } })
      },
      JSXExpressionContainer(node) {
        const e = node.expression
        if (node.parent?.type === 'JSXElement' && e.type === 'Literal' && typeof e.value === 'string')
          context.report({ node, messageId: 'copy', data: { text: e.value.slice(0, 40) } })
      },
    }
  },
}

export default { rules: { 'no-markup-in-containers': noMarkupInContainers } }
