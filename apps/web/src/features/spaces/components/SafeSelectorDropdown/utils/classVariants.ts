export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    // pr-12 reserves the chevron zone (pl-4 + size-4 icon + pr-4) so the trailing balance is not
    // clipped by the card wrapper's overflow-hidden and does not run under the icon.
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer pr-12',
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-4 pr-4 ml-1 self-stretch flex items-center min-h-[2.5rem]',
  }
}
