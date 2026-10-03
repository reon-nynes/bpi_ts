import { Client, APIError, requiresLogin } from '../src/index.js';

const bvid = process.argv[2] ?? 'BV1xx411c7mD';
const cookie = process.env.BILIBILI_COOKIE;
const client = new Client(cookie ? { cookie } : {});

try {
  const video = await client.video.view({ bvid }, { signal: AbortSignal.timeout(5_000) });
  console.log(video.title, video.owner.name);
} catch (error) {
  if (error instanceof APIError && requiresLogin(error)) {
    console.error('Supply BILIBILI_COOKIE for this operation.');
    process.exitCode = 1;
  } else {
    throw error;
  }
}
