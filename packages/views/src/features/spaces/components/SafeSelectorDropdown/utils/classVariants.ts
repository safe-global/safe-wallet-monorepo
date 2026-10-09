export const getSafeSelectorClassVariants = (isSingleSafe: boolean) => {
  return {
    canOpen: !isSingleSafe,
    wrapperClass: isSingleSafe ? '' : 'cursor-pointer',
    // pr-12 reserves trailing space so the balance is not clipped by the card wrapper's
    // overflow-hidden and does not run under the chevron icon.
    triggerClass: isSingleSafe ? 'pr-10' : 'cursor-pointer pr-12',
    // The trigger this sits in is `absolute inset-0` inside a `-m-4` wrapper, so its right edge
    // overshoots the pill by 8px (the 16px negative margin less the pill's own `pr-2`) and is
    // clipped away. The chevron's right padding is measured from that overshot edge, so it needs
    // 8px of it just to reach the pill — `pr-4` is what leaves the visible 8px gap that matches
    // the network chip's `px-2` next to it. Anything smaller reads as flush against the pill.
    iconWrapperClass: isSingleSafe ? 'hidden' : 'pl-2 pr-4 self-stretch flex items-center min-h-10',
  }
}
