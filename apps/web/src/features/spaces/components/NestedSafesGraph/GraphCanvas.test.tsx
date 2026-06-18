import { render, screen } from '@/tests/test-utils'
import GraphCanvas from './GraphCanvas'

// @xyflow/react needs layout measurement jsdom lacks; assert our wiring (the
// laid-out node/edge counts handed to ReactFlow), not reactflow's internals.
jest.mock('@xyflow/react', () => {
  const actual = jest.requireActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => (
      <div data-testid="reactflow" data-node-count={nodes.length} data-edge-count={edges.length} />
    ),
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
  }
})

const A = '0xAAa0000000000000000000000000000000000001'
const B = '0xBbB0000000000000000000000000000000000002'

describe('GraphCanvas', () => {
  it('renders a reactflow canvas with the laid-out node/edge counts', () => {
    render(
      <GraphCanvas
        chainId="1"
        apiNodes={[
          { address: A, name: 'Treasury', isSpaceMember: true, trust: 'trusted' },
          { address: B, name: null, isSpaceMember: false, trust: 'unknown' },
        ]}
        apiEdges={[{ from: A, to: B }]}
      />,
    )
    const canvas = screen.getByTestId('reactflow')
    expect(canvas).toHaveAttribute('data-node-count', '2')
    expect(canvas).toHaveAttribute('data-edge-count', '1')
  })

  it('renders an empty canvas without crashing', () => {
    render(<GraphCanvas chainId="1" apiNodes={[]} apiEdges={[]} />)
    const canvas = screen.getByTestId('reactflow')
    expect(canvas).toHaveAttribute('data-node-count', '0')
    expect(canvas).toHaveAttribute('data-edge-count', '0')
  })
})
