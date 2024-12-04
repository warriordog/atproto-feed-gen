import { Server } from '../lexicon'
import { AppContext } from '../config'
import { algorithmLookup } from '../algos'
import { AtUri } from '@atproto/syntax'

// TODO I have no idea if this will work, and there's no documentation or even examples to copy

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.describeFeedGenerator(async ({ req }) => {
    const shortName = new AtUri(req.url).rkey;
    if (!Reflect.has(algorithmLookup, shortName)) {
      return { status: 404 };
    }

    return {
      encoding: 'application/json',
      body: {
        did: ctx.cfg.serviceDid,
        feeds: [
          {
            uri: AtUri.make(
              ctx.cfg.publisherDid,
              'app.bsky.feed.generator',
              shortName,
            ).toString(),
          }
        ],
      },
    }
  })
}
