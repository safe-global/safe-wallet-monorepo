import { layoutNestedSafesGraph } from './useNestedSafesGraph'

describe('layoutNestedSafesGraph', () => {
  const A = '0xAAa0000000000000000000000000000000000001'
  const B = '0xBbB0000000000000000000000000000000000002'

  it('produces one reactflow node per api node with computed positions', () => {
    const { nodes } = layoutNestedSafesGraph(
      [
        { address: A, name: 'Treasury', isSpaceMember: true, trust: 'trusted' },
        { address: B, name: null, isSpaceMember: false, trust: 'unknown' },
      ],
      [{ from: A, to: B }],
      A,
    )
    expect(nodes).toHaveLength(2)
    const nodeA = nodes.find((n) => n.id === A.toLowerCase())
    expect(nodeA?.type).toBe('safeNode')
    expect(nodeA?.data.isCurrent).toBe(true)
    expect(typeof nodeA?.position.x).toBe('number')
    expect(typeof nodeA?.position.y).toBe('number')
    expect(nodes.find((n) => n.id === B.toLowerCase())?.data.isCurrent).toBe(false)
  })

  it('produces a directed edge per api edge with arrow markers', () => {
    const { edges } = layoutNestedSafesGraph(
      [
        { address: A, name: null, isSpaceMember: true, trust: 'trusted' },
        { address: B, name: null, isSpaceMember: false, trust: 'unknown' },
      ],
      [{ from: A, to: B }],
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].source).toBe(A.toLowerCase())
    expect(edges[0].target).toBe(B.toLowerCase())
    expect(edges[0].markerEnd).toBeDefined()
  })

  it('attaches fiatTotal from the provided map', () => {
    const { nodes } = layoutNestedSafesGraph(
      [{ address: A, name: 'Treasury', isSpaceMember: true, trust: 'trusted' }],
      [],
      undefined,
      { [A.toLowerCase()]: '1240000' },
    )
    expect(nodes[0].data.fiatTotal).toBe('1240000')
  })

  it('handles an empty graph', () => {
    const { nodes, edges } = layoutNestedSafesGraph([], [])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })
})
