import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { whatsAlfAlgorithm } from './whats-alf'

export type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

export interface Algorithm {
  /**
   * Callback to execute the algorithm.
   */
  handler: AlgoHandler;

  /**
   * Short name of the algorithm; will appear in the URL.
   * Max 15 chars.
   */
  shortName: string;

  /**
   * Detailed name of the algorithm.
   */
  displayName: string;

  /**
   * Optional description of the feed / algorithm.
   */
  description?: string;

  /**
   * Optional local path to an avatar to upload.
   */
  avatarPath?: string;
}

export const algorithms: Algorithm[] = [
  whatsAlfAlgorithm
];

export const algorithmLookup = algorithms.reduce((lookup, algo) => {
  if (lookup[algo.shortName]) {
    throw new Error(`Duplicate algorithm key ${algo.shortName}`);
  }

  lookup[algo.shortName] = algo;
  return lookup;
}, {} as Record<string, Algorithm>);
