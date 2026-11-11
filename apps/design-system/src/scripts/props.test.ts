import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { componentNames } from './paths.ts'
import { generateProps } from './props.ts'

const docs = generateProps()
const byName = new Map(docs.map((doc) => [doc.component, doc]))
const propOf = (component: string, displayName: string, prop: string) =>
  byName
    .get(component)
    ?.components.find((doc) => doc.displayName === displayName)
    ?.props.find((item) => item.name === prop)

const unionValues = (type: string | undefined) =>
  (type ?? '')
    .split('|')
    .map((value) => value.trim().replace(/^"|"$/g, ''))
    .filter((value) => value && value !== 'null')
    .sort()

describe('props', () => {
  it('lists Button variant and size with every cva value', () => {
    const cva = byName.get('button')!.cva.find((entry) => entry.name === 'buttonVariants')!
    assert.deepEqual(unionValues(propOf('button', 'Button', 'variant')?.type), [...cva.variants.variant].sort())
    assert.deepEqual(unionValues(propOf('button', 'Button', 'size')?.type), [...cva.variants.size].sort())
    assert.ok(cva.variants.variant.length >= 6)
    assert.ok(cva.variants.size.length >= 10)
  })

  it('documents DialogContent size', () => {
    assert.ok(propOf('dialog', 'DialogContent', 'size'))
  })

  it('drops inherited DOM attributes but keeps className', () => {
    assert.equal(propOf('button', 'Button', 'onClick'), undefined)
    assert.ok(propOf('button', 'Button', 'className'))
  })

  it('yields components for every file, and cva variants for overlay', () => {
    assert.deepEqual(
      docs.map((doc) => doc.component),
      componentNames(),
    )
    for (const doc of docs) {
      if (doc.component === 'overlay') {
        assert.equal(doc.components.length, 0)
        assert.ok(doc.cva.some((entry) => entry.name === 'overlayVariants'))
      } else {
        assert.ok(doc.components.length > 0, `${doc.component} yields no component`)
      }
    }
  })
})
