export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer',
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-3 pr-4 ml-1 self-stretch flex items-center min-h-10',
  }
}
