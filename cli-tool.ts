#!/usr/bin/env tsx
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { analyzeTrend } from './src/services/intelligenceService';

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log('\n====================================');
  console.log('   OSINT TREND INTELLIGENCE TOOL    ');
  console.log('      Powered by Gemini 1.5 Pro     ');
  console.log('====================================\n');

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in environment.');
    process.exit(1);
  }

  while (true) {
    const topic = await rl.question('\n[?] Enter topic, hashtag, or region (or "exit" to quit): ');

    if (topic.toLowerCase() === 'exit') {
      console.log('Exiting OSINT Terminal...');
      break;
    }

    if (!topic.trim()) continue;

    console.log(`\n[*] Initiating deep trace for: "${topic}"...`);
    console.log(`[*] Grounding with Google Search...`);

    try {
      const startTime = Date.now();
      const report = await analyzeTrend(topic);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`\n[+] TRACE COMPLETE (${duration}s)\n`);
      console.log(report.summary);
      console.log('\n------------------------------------');
    } catch (error: any) {
      console.error('\n[!] ANALYSIS FAILED');
      console.error(`${error.message}`);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error('Critical Failure:', err);
  process.exit(1);
});
