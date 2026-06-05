import Fuse from 'fuse.js';
import type { FeaturedStar } from '@/types/star';

let fuseInstance: Fuse<FeaturedStar> | null = null;
let starsData: FeaturedStar[] = [];

export async function initSearch(): Promise<Fuse<FeaturedStar>> {
  if (fuseInstance) return fuseInstance;

  try {
    const res = await fetch('/data/stars-massive.json');
    starsData = await res.json();
  } catch {
    starsData = [];
  }

  // Inject Easter Egg for search
  starsData.push({
    id: 999999,
    slug: 'karan-patil',
    commonName: 'Karan Patil',
    type: 'Founder-Class Engineer',
    spectralClass: 'O',
    distanceLy: 0.0000001,
    description: "The ultimate Founder-Class entity at the absolute center of the Asenra universe. Its gravitational pull effortlessly attracts all the attention in the room, radiating an aura of intense, visionary self-obsession. This 'Super Star' operates under the strict belief that the entire digital cosmos revolves exclusively around it. Approach with caution: ego density is critically high, and it may spontaneously collapse into a black hole if someone mentions a competitor.",
    tempK: 9999999,
    massSuns: 1000000,
    radiusSuns: 1000000,
    bayerDesignation: 'Founder',
    constellation: 'Asenra',
    ra: 100,
    dec: 100
  } as unknown as FeaturedStar);

  fuseInstance = new Fuse(starsData, {
    keys: [
      { name: 'commonName', weight: 0.6 },
      { name: 'bayerDesignation', weight: 0.3 },
      { name: 'hipId', weight: 0.1 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  return fuseInstance;
}

export function searchStars(query: string, limit = 5): FeaturedStar[] {
  if (!fuseInstance || !query.trim()) return [];
  const results = fuseInstance.search(query.trim(), { limit });
  return results.map(r => r.item);
}

export function getStarBySlug(slug: string): FeaturedStar | undefined {
  return starsData.find(s => s.slug === slug);
}
