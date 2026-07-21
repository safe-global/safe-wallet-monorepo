export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer',
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-2 pr-2.5 self-stretch flex items-center min-h-10',
  }
}
