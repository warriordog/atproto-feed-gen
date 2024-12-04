import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { Algorithm } from './index'

export const whatsAlfAlgorithm: Algorithm = {
  shortName: 'whats-alf',
  displayName: "What's Alf?",
  description: 'Sample feed - displays all posts related to Alf.',
  handler: async (ctx: AppContext, params: QueryParams) => {
    let builder = ctx.db
      .selectFrom('post')
      .selectAll()
      .orderBy('indexedAt', 'desc')
      .orderBy('cid', 'desc')
      .limit(params.limit)

    if (params.cursor) {
      const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
      builder = builder.where('post.indexedAt', '<', timeStr)
    }
    const res = await builder.execute()

    const feed = res.map((row) => ({
      post: row.uri,
    }))

    let cursor: string | undefined
    const last = res.at(-1)
    if (last) {
      cursor = new Date(last.indexedAt).getTime().toString(10)
    }

    return {
      cursor,
      feed,
    }
  }
};
