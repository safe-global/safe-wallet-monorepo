import type { EnemyId, WaveDef, WaveGroup } from './types'

const g = (enemy: EnemyId, count: number, interval: number, delay = 0): WaveGroup => ({
  enemy,
  count,
  interval,
  delay,
})

/** Enemy HP scaling per wave: gentle at first, steep towards the final assault. */
export const waveHpMultiplier = (index: number): number => {
  const w = index - 1
  return Math.round((1 + 0.1 * w + 0.009 * w * w) * 100) / 100
}

const RAW_WAVES: Array<Omit<WaveDef, 'index' | 'hpMultiplier'>> = [
  { title: 'Probe', intel: 'Phishing bots probe the perimeter. Cheap, fast, dumb.', groups: [g('phisher', 8, 1.0)] },
  { title: 'Spam wave', intel: 'More bots. Your inbox has never been this full.', groups: [g('phisher', 12, 0.8)] },
  {
    title: 'Drainers',
    intel: 'Drainer scripts sprint for the vault and steal double when they leak.',
    groups: [g('drainer', 8, 0.7)],
  },
  {
    title: 'Poisoned history',
    intel: 'Address poisoners split into dust when scanned. Splash damage helps.',
    groups: [g('poisoner', 8, 1.2), g('phisher', 6, 0.6, 6)],
  },
  {
    title: 'Blind signers',
    intel: 'Heavily armored signers who never read the calldata. Impact damage recommended.',
    groups: [g('blindSigner', 4, 2.0), g('phisher', 10, 0.5, 3)],
  },
  {
    title: 'MEV swarm',
    intel: 'Air units incoming. MEV bots fly straight over the path. Cannons cannot reach them.',
    groups: [g('mevBot', 8, 0.8)],
  },
  { title: 'Lazarus scouts', intel: 'The Lazarus Group sends its first operatives.', groups: [g('lazarus', 8, 1.2)] },
  {
    title: 'Social engineering',
    intel: 'Stealth units. Only a Safenet Sentinel can reveal them for your other towers.',
    groups: [g('socialEngineer', 6, 1.5)],
  },
  {
    title: 'Fake frontends',
    intel: 'Spoofed Safe{Wallet} clones with hit-absorbing shields, escorted by drainers.',
    groups: [g('spoofedUi', 8, 1.2), g('drainer', 10, 0.5, 4)],
  },
  {
    title: 'BOSS: Rug pull whale',
    intel: 'A compromised protocol treasury lumbers toward your Safe. It bursts into bots when it falls.',
    groups: [g('phisher', 10, 0.6), g('rugWhale', 1, 1, 8)],
  },
  { title: 'Botnet', intel: 'A full botnet of phishing bots. Volume over quality.', groups: [g('phisher', 30, 0.35)] },
  {
    title: 'Delegatecall',
    intel: 'Malicious delegatecalls fly in while Lazarus keeps the ground busy.',
    groups: [g('delegatecall', 10, 1.0), g('lazarus', 6, 1.2, 3)],
  },
  {
    title: 'Unlimited approvals',
    intel: 'Approval hijackers regenerate as they walk. Safe Guards keep draining them.',
    groups: [g('approvalHijacker', 8, 1.4)],
  },
  {
    title: 'Hardware wallet queue',
    intel: 'Blind signers march with social engineers hidden among them.',
    groups: [g('blindSigner', 10, 1.2), g('socialEngineer', 4, 2.0, 5)],
  },
  {
    title: 'Coordinated attack',
    intel: 'Ground, fast and air at once. Check your coverage.',
    groups: [g('lazarus', 10, 1.0), g('drainer', 12, 0.5, 4), g('mevBot', 6, 0.9, 8)],
  },
  { title: 'Poison flood', intel: 'The address book is under siege.', groups: [g('poisoner', 16, 0.8)] },
  {
    title: 'UI clones',
    intel: 'Shielded frontends on the ground, delegatecalls in the air.',
    groups: [g('spoofedUi', 12, 1.0), g('delegatecall', 8, 1.1, 6)],
  },
  {
    title: 'Insider threat',
    intel: 'Social engineers and approval hijackers. Detection and sustained damage.',
    groups: [g('socialEngineer', 10, 1.2), g('approvalHijacker', 6, 1.5, 5)],
  },
  {
    title: 'Lazarus battalion',
    intel: 'The North Korean battalion arrives in force.',
    groups: [g('lazarus', 20, 0.7)],
  },
  {
    title: 'BOSS: Supply chain worm',
    intel: 'A poisoned npm package crawls through your frontend. It regenerates and sheds drainers.',
    groups: [g('spoofedUi', 6, 1.2), g('mevBot', 8, 0.8, 4), g('supplyWorm', 1, 1, 10)],
  },
  {
    title: 'Sweepers',
    intel: 'Thirty drainer scripts. Slow them or lose the treasury.',
    groups: [g('drainer', 30, 0.3)],
  },
  {
    title: 'Signing party',
    intel: 'Armor everywhere. Cannons and Safenet Validators earn their keep.',
    groups: [g('blindSigner', 14, 0.9), g('approvalHijacker', 8, 1.2, 6)],
  },
  {
    title: 'Air raid',
    intel: 'Every unit in this wave is airborne.',
    groups: [g('delegatecall', 14, 0.8), g('mevBot', 14, 0.6, 3)],
  },
  {
    title: 'Deep cover',
    intel: 'Lazarus operatives and stealthy social engineers.',
    groups: [g('lazarus', 16, 0.8), g('socialEngineer', 8, 1.2, 4)],
  },
  {
    title: 'Twin whales',
    intel: 'Two rug pull whales with a poisoner escort.',
    groups: [g('poisoner', 10, 0.8), g('rugWhale', 2, 6, 6)],
  },
  {
    title: 'Approval storm',
    intel: 'Regenerating hijackers under shielded cover.',
    groups: [g('approvalHijacker', 14, 0.9), g('spoofedUi', 10, 1.0, 5)],
  },
  {
    title: 'Zero-day flood',
    intel: 'Seventy units. Area damage or bust.',
    groups: [g('phisher', 50, 0.25), g('drainer', 20, 0.4, 5)],
  },
  {
    title: 'Full spectrum',
    intel: 'Lazarus, blind signers and delegatecalls in one push.',
    groups: [g('lazarus', 24, 0.6), g('blindSigner', 10, 1.0, 4), g('delegatecall', 8, 1.0, 8)],
  },
  {
    title: 'Worm nest',
    intel: 'Two supply chain worms with stealth and air support.',
    groups: [g('socialEngineer', 10, 1.0), g('mevBot', 10, 0.7, 3), g('supplyWorm', 2, 8, 8)],
  },
  {
    title: 'FINAL: Lazarus commander',
    intel: 'The nation-state APT arrives in person. Hold the threshold.',
    groups: [g('lazarus', 12, 0.8), g('delegatecall', 8, 1.0, 4), g('lazarusCommander', 1, 1, 10)],
  },
]

export const WAVES: WaveDef[] = RAW_WAVES.map((wave, i) => ({
  ...wave,
  index: i + 1,
  hpMultiplier: waveHpMultiplier(i + 1),
}))

export const TOTAL_WAVES = WAVES.length

const ENDLESS_POOL: EnemyId[] = [
  'phisher',
  'drainer',
  'poisoner',
  'blindSigner',
  'lazarus',
  'socialEngineer',
  'delegatecall',
  'mevBot',
  'spoofedUi',
  'approvalHijacker',
]
const ENDLESS_BOSSES: EnemyId[] = ['rugWhale', 'supplyWorm', 'lazarusCommander']

/** Procedurally composed waves past the scripted 30, for endless mode. Deterministic per index. */
export const generateEndlessWave = (index: number): WaveDef => {
  const n = index - TOTAL_WAVES
  const pick = (k: number): EnemyId => ENDLESS_POOL[(index * 7 + k * 3) % ENDLESS_POOL.length]
  const groups: WaveGroup[] = [g(pick(0), 12 + n * 2, 0.5), g(pick(1), 8 + n, 0.8, 4), g(pick(2), 6 + n, 1.0, 8)]
  const isBossWave = n % 5 === 0
  if (isBossWave) groups.push(g(ENDLESS_BOSSES[(n / 5 - 1) % ENDLESS_BOSSES.length], 1 + Math.floor(n / 15), 6, 10))
  return {
    index,
    title: isBossWave ? `Endless ${n}: boss assault` : `Endless ${n}`,
    intel: isBossWave
      ? 'The mempool never sleeps. A boss leads this endless assault.'
      : 'Beyond the scripted attacks. Every wave is stronger than the last.',
    hpMultiplier: waveHpMultiplier(index),
    groups,
  }
}

export const getWave = (index: number, endless = false): WaveDef | undefined =>
  index <= TOTAL_WAVES ? WAVES[index - 1] : endless && index > 0 ? generateEndlessWave(index) : undefined

export const waveEnemyCounts = (wave: WaveDef): Array<{ enemy: EnemyId; count: number }> => {
  const counts = new Map<EnemyId, number>()
  wave.groups.forEach((group) => counts.set(group.enemy, (counts.get(group.enemy) ?? 0) + group.count))
  return Array.from(counts.entries()).map(([enemy, count]) => ({ enemy, count }))
}
