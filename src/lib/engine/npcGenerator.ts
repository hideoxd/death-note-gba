/**
 * Procedural NPC Target Generator
 *
 * Generates investigation targets with:
 * - Seeded deterministic RNG (save-safe)
 * - Crime severity tiers (petty → syndicate boss)
 * - Unique Japanese names from large pools
 * - Threat levels that affect world opinion differently
 * - Dynamic decoy sophistication per wave
 * - Region-weighted distribution
 */

import { mulberry32, seededHash } from '$lib/utils/rng';
import type { InvestigationRegion, InvestigationTarget } from '$lib/types/game';

// ── Crime Severity Tiers ──

export type CrimeSeverity = 'petty' | 'moderate' | 'serious' | 'major' | 'syndicate';

export interface CrimeProfile {
  alias: string;
  severity: CrimeSeverity;
  /** How much public opinion shifts when eliminated (-negative = pro-Kira) */
  opinionImpact: number;
  /** Base suspicion cost when investigating this target */
  investigationHeat: number;
}

const crimeProfiles: CrimeProfile[] = [
  // Petty — killing these scares the public
  { alias: 'Shoplifting Repeat Offender', severity: 'petty', opinionImpact: 8, investigationHeat: 1 },
  { alias: 'Online Scam Operator', severity: 'petty', opinionImpact: 6, investigationHeat: 1 },
  { alias: 'Graffiti Vandal Gang Leader', severity: 'petty', opinionImpact: 9, investigationHeat: 1 },
  { alias: 'Unlicensed Street Vendor Ring', severity: 'petty', opinionImpact: 7, investigationHeat: 1 },
  { alias: 'Parking Meter Fraud Schemer', severity: 'petty', opinionImpact: 10, investigationHeat: 1 },

  // Moderate — mixed public reaction
  { alias: 'Insurance Fraud Architect', severity: 'moderate', opinionImpact: 3, investigationHeat: 2 },
  { alias: 'Construction Kickback Broker', severity: 'moderate', opinionImpact: 2, investigationHeat: 2 },
  { alias: 'Identity Theft Syndicate Node', severity: 'moderate', opinionImpact: 1, investigationHeat: 2 },
  { alias: 'Counterfeit Medicine Distributor', severity: 'moderate', opinionImpact: -1, investigationHeat: 2 },
  { alias: 'Illegal Gambling Den Operator', severity: 'moderate', opinionImpact: 2, investigationHeat: 2 },
  { alias: 'Corporate Embezzlement Manager', severity: 'moderate', opinionImpact: 0, investigationHeat: 2 },
  { alias: 'Tax Evasion Network Coordinator', severity: 'moderate', opinionImpact: 1, investigationHeat: 2 },

  // Serious — public generally approves
  { alias: 'Kidnapping Coordinator', severity: 'serious', opinionImpact: -3, investigationHeat: 3 },
  { alias: 'Armed Robbery Cell Leader', severity: 'serious', opinionImpact: -4, investigationHeat: 3 },
  { alias: 'Human Trafficking Route Manager', severity: 'serious', opinionImpact: -6, investigationHeat: 3 },
  { alias: 'Violent Loan Shark Enforcer', severity: 'serious', opinionImpact: -3, investigationHeat: 3 },
  { alias: 'Arson Ring Planner', severity: 'serious', opinionImpact: -4, investigationHeat: 3 },
  { alias: 'Serial Extortion Caller', severity: 'serious', opinionImpact: -2, investigationHeat: 3 },
  { alias: 'Blackmail Syndicate Fixer', severity: 'serious', opinionImpact: -3, investigationHeat: 3 },
  { alias: 'Drug Lab Chemist', severity: 'serious', opinionImpact: -4, investigationHeat: 3 },

  // Major — public strongly supports Kira
  { alias: 'Serial Killer Under Investigation', severity: 'major', opinionImpact: -8, investigationHeat: 4 },
  { alias: 'Organized Hit Contract Broker', severity: 'major', opinionImpact: -7, investigationHeat: 4 },
  { alias: 'International Arms Dealer', severity: 'major', opinionImpact: -6, investigationHeat: 4 },
  { alias: 'Child Exploitation Network Boss', severity: 'major', opinionImpact: -10, investigationHeat: 4 },
  { alias: 'Cartel Supply Chain Director', severity: 'major', opinionImpact: -7, investigationHeat: 4 },
  { alias: 'Terrorism Finance Facilitator', severity: 'major', opinionImpact: -9, investigationHeat: 4 },

  // Syndicate Boss — maximum Kira worship
  { alias: 'Yakuza Clan Underboss', severity: 'syndicate', opinionImpact: -12, investigationHeat: 5 },
  { alias: 'Shadow Government Fixer', severity: 'syndicate', opinionImpact: -11, investigationHeat: 5 },
  { alias: 'Continental Drug Kingpin', severity: 'syndicate', opinionImpact: -14, investigationHeat: 5 },
  { alias: 'War Criminal In Hiding', severity: 'syndicate', opinionImpact: -15, investigationHeat: 5 }
];

// ── Name Pools (50+ unique Japanese names) ──

const familyNames = [
  'Tanaka', 'Yamamoto', 'Watanabe', 'Suzuki', 'Takahashi',
  'Kobayashi', 'Nakamura', 'Kato', 'Ito', 'Saito',
  'Murakami', 'Ogawa', 'Hashimoto', 'Ishikawa', 'Matsuda',
  'Nishimura', 'Morimoto', 'Hayashi', 'Shimizu', 'Yamazaki',
  'Kimura', 'Abe', 'Inoue', 'Fujita', 'Okada',
  'Goto', 'Hasegawa', 'Mori', 'Tsuda', 'Ueda'
];

const givenNames = [
  'Koji', 'Ren', 'Atsushi', 'Yuto', 'Takumi',
  'Shunpei', 'Naoki', 'Keita', 'Daiki', 'Kenta',
  'Riku', 'Shota', 'Haruto', 'Sora', 'Yuya',
  'Ryota', 'Kazuki', 'Tsubasa', 'Akira', 'Hiroshi',
  'Masaru', 'Tetsuya', 'Noboru', 'Isamu', 'Jiro',
  'Makoto', 'Satoshi', 'Yuki', 'Kaito', 'Soichi'
];

const regions: InvestigationRegion[] = ['kanto', 'kansai', 'tohoku', 'kyushu'];

// ── Generator ──

export interface GeneratedTarget extends InvestigationTarget {
  crime: CrimeProfile;
  threatLevel: number; // 1-5
}

/**
 * Create seeded RNG from game seed + wave number
 */
const createWaveRng = (gameSeed: string, wave: number): (() => number) => {
  const hash = seededHash(`${gameSeed}-wave-${wave}`);
  return mulberry32(hash);
};

/**
 * Shuffle array in-place using seeded RNG (Fisher-Yates)
 */
const seededShuffle = <T>(arr: T[], rng: () => number): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Pick a crime profile weighted by wave difficulty
 * Early waves: more petty/moderate criminals
 * Later waves: more serious/major/syndicate criminals
 */
const pickCrimeProfile = (rng: () => number, wave: number, index: number): CrimeProfile => {
  // Build severity weights based on wave progression
  const waveProgress = Math.min(1, (wave - 1) / 8); // 0 at wave 1, 1 at wave 9+

  const weights: Record<CrimeSeverity, number> = {
    petty:     Math.max(0.05, 0.35 - waveProgress * 0.3),
    moderate:  Math.max(0.1,  0.35 - waveProgress * 0.15),
    serious:   0.15 + waveProgress * 0.2,
    major:     0.1 + waveProgress * 0.2,
    syndicate: Math.min(0.2, waveProgress * 0.2)
  };

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;
  let pickedSeverity: CrimeSeverity = 'moderate';
  for (const [severity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      pickedSeverity = severity as CrimeSeverity;
      break;
    }
  }

  // Filter by severity and pick one
  const pool = crimeProfiles.filter(c => c.severity === pickedSeverity);
  if (pool.length === 0) return crimeProfiles[0];

  const pickIndex = Math.floor(rng() * pool.length);
  return pool[pickIndex];
};

/**
 * Generate a unique name using seeded RNG
 */
const generateName = (rng: () => number, usedNames: Set<string>): string => {
  let attempts = 0;
  while (attempts < 50) {
    const family = familyNames[Math.floor(rng() * familyNames.length)];
    const given = givenNames[Math.floor(rng() * givenNames.length)];
    const name = `${given} ${family}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  // Fallback: append number to guarantee uniqueness
  const family = familyNames[Math.floor(rng() * familyNames.length)];
  const given = givenNames[Math.floor(rng() * givenNames.length)];
  return `${given} ${family} II`;
};

/**
 * Generate a full wave of investigation targets
 */
export const generateTargetWave = (
  gameSeed: string,
  wave: number
): GeneratedTarget[] => {
  const rng = createWaveRng(gameSeed, wave);
  const count = 4;
  const usedNames = new Set<string>();

  // Decoy position varies per wave, harder to predict
  const decoyIndex = Math.floor(rng() * count);

  // Region distribution — shuffle to avoid predictable patterns
  const waveRegions = seededShuffle(regions, rng);

  const targets: GeneratedTarget[] = [];

  for (let i = 0; i < count; i++) {
    const crime = pickCrimeProfile(rng, wave, i);
    const trueName = generateName(rng, usedNames);
    const region = waveRegions[i % waveRegions.length];
    const isDecoy = i === decoyIndex;

    // Threat level: 1-5 based on severity
    const threatLevel =
      crime.severity === 'petty' ? 1
      : crime.severity === 'moderate' ? 2
      : crime.severity === 'serious' ? 3
      : crime.severity === 'major' ? 4
      : 5;

    targets.push({
      id: `wave-${wave}-target-${i + 1}`,
      alias: isDecoy ? generateDecoyAlias(rng, crime.severity) : crime.alias,
      trueName,
      region,
      isDecoy,
      knownName: false,
      knownFace: false,
      faceSource: null,
      eliminated: false,
      crime: isDecoy
        ? { ...crime, alias: 'Decoy Profile', opinionImpact: 20, investigationHeat: 1 }
        : crime,
      threatLevel
    });
  }

  return targets;
};

/**
 * Generate a plausible decoy alias that blends with real targets
 */
const generateDecoyAlias = (rng: () => number, nearbySeverity: CrimeSeverity): string => {
  const decoyAliases: Record<CrimeSeverity, string[]> = {
    petty: [
      'Suspected Petty Theft Ring Contact',
      'Rumored Fare Evasion Coordinator',
      'Alleged Minor Fraud Facilitator'
    ],
    moderate: [
      'Unverified Smuggling Associate',
      'Suspected Money Laundering Frontend',
      'Alleged Bribery Chain Intermediary'
    ],
    serious: [
      'Suspected Arms Cache Controller',
      'Reported Kidnapping Ring Member',
      'Alleged Violent Crime Organizer'
    ],
    major: [
      'Unconfirmed Cartel Liaison',
      'Suspected Serial Crime Coordinator',
      'Alleged International Crime Figure'
    ],
    syndicate: [
      'Rumored Criminal Empire Advisor',
      'Suspected Shadow Network Architect',
      'Alleged Yakuza Financial Controller'
    ]
  };

  const pool = decoyAliases[nearbySeverity] || decoyAliases.moderate;
  return pool[Math.floor(rng() * pool.length)];
};

/**
 * Strip extended fields to produce standard InvestigationTarget[]
 * for compatibility with existing game state
 */
export const toInvestigationTargets = (generated: GeneratedTarget[]): InvestigationTarget[] => {
  return generated.map(({ crime, threatLevel, ...target }) => target);
};

/**
 * Get the opinion impact for a specific target by ID
 * Used by the reducer to apply correct opinion shift
 */
export const getTargetOpinionImpact = (
  gameSeed: string,
  wave: number,
  targetId: string
): number => {
  const targets = generateTargetWave(gameSeed, wave);
  const match = targets.find(t => t.id === targetId);
  return match?.crime.opinionImpact ?? 0;
};

/**
 * Get crime severity label for display
 */
export const severityLabel = (severity: CrimeSeverity): string => {
  switch (severity) {
    case 'petty': return 'LOW';
    case 'moderate': return 'MED';
    case 'serious': return 'HIGH';
    case 'major': return 'CRIT';
    case 'syndicate': return 'BOSS';
  }
};

/**
 * Get threat color CSS class
 */
export const threatColorClass = (threatLevel: number): string => {
  if (threatLevel >= 5) return 'threat-boss';
  if (threatLevel >= 4) return 'threat-major';
  if (threatLevel >= 3) return 'threat-serious';
  if (threatLevel >= 2) return 'threat-moderate';
  return 'threat-petty';
};
