import { AtpAgent } from '@atproto/api'
import { ids } from '../src/lexicon/lexicons'
import prompts from '@inquirer/prompts'
import { algorithms } from '../src/algos'

async function run() {
  const handle = await prompts.input({ message: 'Enter your Bluesky handle:', required: true });
  const password = await prompts.password({ message: 'Enter your Bluesky password (preferably an App Password):' });
  const service = await prompts.input({ message: 'Optionally, enter a custom PDS service to sign in with:', required: false, default: 'https://bsky.social' });
  const algoKey = await prompts.input({ message: 'Optionally, enter a shortname to publish only that specific algorithm:', required: false });
  const confirm = await prompts.confirm({ message: 'Are you sure you want to delete this record? Any likes that your feed has will be lost:' });

  if (!confirm) {
    console.log('Aborting...');
    return;
  }

  // only update this if in a test environment
  const agent = new AtpAgent({ service: service ? service : 'https://bsky.social' });
  await agent.login({ identifier: handle, password });

  if (algoKey) {
    if (!algorithms.some(a => a.shortName === algoKey)) {
      console.warn(`Unknown algorithm "${algoKey}", continuing anyway`);
    }

    await deleteRecord(agent, algoKey);
  } else {
    for (const algo of algorithms) {
      await deleteRecord(agent, algo.shortName);
    }
  }
}

await run();
console.log('All done 🎉');

async function deleteRecord(agent: AtpAgent, rkey: string): Promise<void> {
  await agent.api.com.atproto.repo.deleteRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey,
  });
}
