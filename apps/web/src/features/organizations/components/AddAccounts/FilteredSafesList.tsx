import SafesList from '@/features/organizations/components/AddAccounts/SafesList'

const FilteredSafesList = ({ filteredSafes }: { filteredSafes: any }) => {
  return <SafesList safes={filteredSafes} />
}

export default FilteredSafesList
