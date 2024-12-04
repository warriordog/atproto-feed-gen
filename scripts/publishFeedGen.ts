import dotenv from 'dotenv'
import prompts from '@inquirer/prompts'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'
import { Algorithm, algorithmLookup, algorithms } from '../src/algos'
import { extname } from 'path'

dotenv.config();
if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
  throw new Error('Please provide a hostname in the .env file');
}

async function run() {
  const handle = await prompts.input({ message: 'Enter your Bluesky handle:', required: true });
  const password = await prompts.password({ message: 'Enter your Bluesky password (preferably an App Password):' });
  const service = await prompts.input({ message: 'Optionally, enter a custom PDS service to sign in with:', required: false, default: 'https://bsky.social' });
  const algoKey = await prompts.input({ message: 'Optionally, enter a shortname to publish only that specific algorithm:', required: false });

  // only update this if in a test environment
  const agent = new AtpAgent({ service: service ?? 'https://bsky.social' });
  await agent.login({ identifier: handle, password });

  if (algoKey) {
    const algo = algorithmLookup[algoKey];
    if (!algo) {
      throw new Error(`Unknown algorithm "${algoKey}"`);
    }

    await registerAlgorithm(agent, algo);
  } else {
    for (const algo of algorithms) {
      await registerAlgorithm(agent, algo);
    }
  }
}

await run();
console.log('All done 🎉');

async function registerAlgorithm(agent: AtpAgent, algorithm: Algorithm): Promise<void> {
  const avatarRef = await uploadAvatar(agent, algorithm);
  const feedGenDid = process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`;
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: algorithm.shortName,
    record: {
      did: feedGenDid,
      displayName: algorithm.displayName,
      description: algorithm.description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
    },
  });
}

async function uploadAvatar(agent: AtpAgent, algorithm: Algorithm): Promise<BlobRef | undefined> {
  if (!algorithm.avatarPath) return undefined;

  const encoding = getEncoding(algorithm.avatarPath);
  const img = await fs.readFile(algorithm.avatarPath);
  const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, { encoding });
  return blobRes.data.blob;
}

function getEncoding(path: string): string {
  const ext = extname(path).toLowerCase();

  if (ext === 'png') {
    return 'image/png';
  }

  if (ext === 'jpg' || ext === 'jpeg') {
    return 'image/jpeg';
  }

  throw new Error(`Unsupported avatar format: ${ext}`);
}