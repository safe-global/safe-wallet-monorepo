const MOCK_ACCOUNTS = [
  { name: 'Payroll', address: '0x8675...a19b', balance: '$39.95M' },
  { name: 'Treasury', address: '0x8675...a19b', balance: '$39.95M' },
  { name: 'My account', address: '0x8675...a19b', balance: '$39.95M' },
]

const AccountsSection = () => {
  return (
    <div className="flex flex-col">
      {MOCK_ACCOUNTS.map((account) => (
        <button
          key={account.name}
          type="button"
          className="flex items-center justify-between px-4 py-3 hover:bg-accent rounded-lg mx-2 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-muted" />
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-semibold text-foreground">{account.name}</span>
              <span className="text-xs text-muted-foreground">{account.address}</span>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{account.balance}</span>
        </button>
      ))}
    </div>
  )
}

export default AccountsSection
