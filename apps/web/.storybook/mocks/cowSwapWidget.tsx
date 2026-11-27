// Stands in for the live CoW Swap iframe so swap stories screenshot deterministically
export const CowSwapWidget = () => (
  <div
    data-testid="cow-swap-widget-mock"
    style={{
      height: '860px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed var(--color-border-light)',
      color: 'var(--color-text-secondary)',
      background: 'var(--color-background-paper)',
    }}
  >
    CoW Swap widget
  </div>
)
