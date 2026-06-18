import { useCallback, useMemo, type MouseEvent, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ReactFlow, Background, Controls, MiniMap, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useChain } from '@/hooks/useChains'
import { useGetHref } from '@/hooks/safes/useGetHref'
import SafeNode from './SafeNode'
import { layoutNestedSafesGraph, type SafeNodeData } from './useNestedSafesGraph'

type ApiNode = { address: string; name: string | null; isSpaceMember: boolean; trust: SafeNodeData['trust'] }
type ApiEdge = { from: string; to: string }

const nodeTypes = { safeNode: SafeNode }

function GraphCanvas({
  apiNodes,
  apiEdges,
  chainId,
  currentAddress,
  fiatByAddress,
}: {
  apiNodes: Array<ApiNode>
  apiEdges: Array<ApiEdge>
  chainId: string
  currentAddress?: string
  fiatByAddress?: Record<string, string>
}): ReactElement {
  const router = useRouter()
  const chain = useChain(chainId)
  const getHref = useGetHref(router)

  const { nodes, edges } = useMemo(
    () => layoutNestedSafesGraph(apiNodes, apiEdges, currentAddress, fiatByAddress),
    [apiNodes, apiEdges, currentAddress, fiatByAddress],
  )

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (!chain) return
      const data = node.data as SafeNodeData
      // Reuse the app's canonical "open this Safe" href: safe=<shortName>:<address>
      router.push(getHref(chain, data.address))
    },
    [router, getHref, chain],
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas
