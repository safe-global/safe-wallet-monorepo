import dagre from '@dagrejs/dagre'
import { type Edge, type Node, MarkerType } from '@xyflow/react'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type NodeTrust = 'trusted' | 'suspicious' | 'unknown'

export type SafeNodeData = {
  address: string
  name: string | null
  isSpaceMember: boolean
  trust: NodeTrust
  isCurrent: boolean
  fiatTotal?: string
}

type ApiNode = { address: string; name: string | null; isSpaceMember: boolean; trust: NodeTrust }
type ApiEdge = { from: string; to: string }

const NODE_WIDTH = 220
const NODE_HEIGHT = 96

/**
 * Lays the nested-safe graph out top-down with dagre and maps it to the
 * reactflow node/edge shape. Pure function so it can be unit-tested without
 * mounting reactflow.
 */
export function layoutNestedSafesGraph(
  apiNodes: Array<ApiNode>,
  apiEdges: Array<ApiEdge>,
  currentAddress?: string,
  fiatByAddress?: Record<string, string>,
): { nodes: Array<Node<SafeNodeData>>; edges: Array<Edge> } {
  if (apiNodes.length === 0) return { nodes: [], edges: [] }

  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 80 })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of apiNodes) {
    graph.setNode(node.address.toLowerCase(), { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of apiEdges) {
    graph.setEdge(edge.from.toLowerCase(), edge.to.toLowerCase())
  }

  dagre.layout(graph)

  const nodes: Array<Node<SafeNodeData>> = apiNodes.map((node) => {
    const pos = graph.node(node.address.toLowerCase())
    return {
      id: node.address.toLowerCase(),
      type: 'safeNode',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        address: node.address,
        name: node.name,
        isSpaceMember: node.isSpaceMember,
        trust: node.trust,
        isCurrent: currentAddress ? sameAddress(node.address, currentAddress) : false,
        fiatTotal: fiatByAddress?.[node.address.toLowerCase()],
      },
    }
  })

  const edges: Array<Edge> = apiEdges.map((edge, index) => ({
    id: `${edge.from.toLowerCase()}-${edge.to.toLowerCase()}-${index}`,
    source: edge.from.toLowerCase(),
    target: edge.to.toLowerCase(),
    markerEnd: { type: MarkerType.ArrowClosed },
  }))

  return { nodes, edges }
}
