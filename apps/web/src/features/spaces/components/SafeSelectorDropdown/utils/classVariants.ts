export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer',
    iconWrapperClass: isSingleSafe
      ? 'hidden'
      : 'border-l border-border pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]',
  }
}
