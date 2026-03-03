import type { Meta, StoryObj } from '@storybook/react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../resizable'

/**
 * Resizable Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-52055
 */
const meta = {
  title: 'UI/Resizable',
  component: ResizablePanelGroup,
} satisfies Meta<typeof ResizablePanelGroup>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Horizontal with Nested Vertical</h3>
        <ResizablePanelGroup orientation="horizontal" className="max-w-md rounded-lg border">
          <ResizablePanel defaultSize="50%">
            <div className="flex h-[200px] items-center justify-center bg-muted p-6">
              <span className="font-semibold">One</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="25%">
                <div className="flex h-full items-center justify-center bg-muted p-6">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="75%">
                <div className="flex h-full items-center justify-center bg-muted p-6">
                  <span className="font-semibold">Three</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Vertical</h3>
        <ResizablePanelGroup orientation="vertical" className="min-h-[200px] max-w-md rounded-lg border">
          <ResizablePanel defaultSize="25%">
            <div className="flex h-full items-center justify-center bg-muted p-6">
              <span className="font-semibold">Header</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <div className="flex h-full items-center justify-center bg-muted p-6">
              <span className="font-semibold">Content</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  ),
}
