const ADJECTIVES = ['Quiet', 'Amber', 'Silver', 'Hidden', 'Northern', 'Calm', 'Swift', 'Granite', 'Misty', 'Golden']
const NOUNS = ['Harbor', 'Falcon', 'Meadow', 'Lantern', 'Summit', 'River', 'Beacon', 'Orchard', 'Canyon', 'Willow']

const randomIndex = (length: number): number => crypto.getRandomValues(new Uint32Array(1))[0] % length

export const createRandomWorkspaceName = (): string =>
  `${ADJECTIVES[randomIndex(ADJECTIVES.length)]} ${NOUNS[randomIndex(NOUNS.length)]} ${100 + randomIndex(900)}`
