import type {
  VaultDepositTransactionInfo,
  VaultRedeemTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

function ObjectViewer({ data }: { data: object }) {
  // If it's not an object or array, just show its value
  if (typeof data !== 'object' || data === null) {
    return <span>{JSON.stringify(data)}</span>
  }

  // If it's an array, render each item
  if (Array.isArray(data)) {
    return (
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <ObjectViewer data={item} />
          </li>
        ))}
      </ul>
    )
  }

  // Otherwise, it's a non-null object
  const entries = Object.entries(data)
  return (
    <div style={{ marginLeft: '1rem' }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ marginBottom: '0.5rem' }}>
          <strong>{key}: </strong>
          <ObjectViewer data={value} />
        </div>
      ))}
    </div>
  )
}

const VaultDeposit = ({ txInfo }: { txInfo: VaultDepositTransactionInfo | VaultRedeemTransactionInfo }) => {
  return <ObjectViewer data={txInfo} />
}

export default VaultDeposit
