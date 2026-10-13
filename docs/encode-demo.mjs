// Encodes docs/demo-frames/ (from record-demo.mjs) into docs/demo.mp4 and a README-sized docs/demo.gif.
// Frames arrive whenever the browser repaints, so each one is held for its real on-screen duration.
// Needs ffmpeg on PATH (or FFMPEG env). Usage: node docs/encode-demo.mjs
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DOCS = fileURLToPath(new URL('.', import.meta.url));
const FRAMES = join(DOCS, 'demo-frames');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const GIF_SPEED = 2.5; // the GIF is a quick preview; the MP4 keeps real time

const frames = readdirSync(FRAMES).filter((f) => f.endsWith('.jpg')).sort();
const times = frames.map((f) => Number(f.split('_')[1].replace('.jpg', '')));

const list = frames
  .map((f, i) => `file '${join(FRAMES, f).replace(/\\/g, '/')}'\nduration ${(i < frames.length - 1 ? times[i + 1] - times[i] : 2).toFixed(3)}`)
  .join('\n');
const listFile = join(FRAMES, 'frames.txt');
writeFileSync(listFile, `${list}\nfile '${join(FRAMES, frames.at(-1)).replace(/\\/g, '/')}'\n`);

const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const input = ['-f', 'concat', '-safe', '0', '-i', listFile];

console.log('encoding demo.mp4 …');
run([...input, '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-movflags', '+faststart', join(DOCS, 'demo.mp4')]);

console.log('encoding demo.gif …');
const gifFilter =
  `setpts=PTS/${GIF_SPEED},fps=6,scale=720:-1:flags=lanczos,split[a][b];` +
  '[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle';
run([...input, '-filter_complex', gifFilter, join(DOCS, 'demo.gif')]);

for (const f of ['demo.mp4', 'demo.gif']) console.log(`${f}: ${(statSync(join(DOCS, f)).size / 1e6).toFixed(1)} MB`);
