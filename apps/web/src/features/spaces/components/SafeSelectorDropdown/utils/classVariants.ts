export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    // pr-12 reserves trailing space so the balance is not clipped by the card wrapper's
    // overflow-hidden and does not run under the chevron icon.
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer pr-12',
    // The `absolute inset-0` trigger in the `-m-4` wrapper overshoots the pill's right edge by 8px, so `pr-4`
    // spends 8px reaching the pill and leaves an 8px gap matching the network chip's `px-2`. Smaller reads flush.
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-2 pr-4 self-stretch flex items-center min-h-10',
  }
}
