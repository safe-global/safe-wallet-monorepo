import { EventType } from '../types'

const COPY_CATEGORY = 'copy'

/**
 * Creates an analytics event for when the user copies an address
 * @param screenPath - The pathname where the copy action occurred
 */
export const createAddressCopyEvent = (screenPath: string) => ({
  eventName: EventType.META,
  eventCategory: COPY_CATEGORY,
  eventAction: 'Address copied',
  eventLabel: screenPath,
})
