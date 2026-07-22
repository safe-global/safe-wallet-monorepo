export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    // pr-12 reserves trailing space so the balance is not clipped by the card wrapper's
    // overflow-hidden and does not run under the chevron icon.
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer pr-12',
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-2 pr-2.5 self-stretch flex items-center min-h-10',
  }
}
