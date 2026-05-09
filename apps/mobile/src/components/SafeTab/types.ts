export interface safeTabItem<T> {
  label: string
  testID?: string
  Component: React.FC<T>
}
