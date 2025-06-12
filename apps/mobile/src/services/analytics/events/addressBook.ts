import { EventType } from '../types'

export const createContactAddedEvent = (totalContactCount: number) => ({
  eventName: EventType.META,
  eventCategory: 'address-book',
  eventAction: 'Contact added',
  eventLabel: totalContactCount.toString(),
})

export const createContactEditedEvent = (totalContactCount: number) => ({
  eventName: EventType.META,
  eventCategory: 'address-book',
  eventAction: 'Contact edited',
  eventLabel: totalContactCount.toString(),
})

export const createContactRemovedEvent = (totalContactCount: number) => ({
  eventName: EventType.META,
  eventCategory: 'address-book',
  eventAction: 'Contact removed',
  eventLabel: totalContactCount.toString(),
})

export const createAddressBookScreenVisitEvent = (totalContactCount: number) => ({
  eventName: EventType.META,
  eventCategory: 'address-book',
  eventAction: 'Screen visited',
  eventLabel: totalContactCount.toString(),
})
