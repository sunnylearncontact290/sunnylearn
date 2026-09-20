import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { patchParseUrl } from './patch-parseurl.js';

async function bundleApi() {
  console.log('⚡ Ensuring dependencies are patched against [DEP0169]...');
  patchParseUrl();

  console.log('⚡ Bundling Vercel serverless function into api/index.ts...');
  
  await esbuild.build({
    entryPoints: ['src/server/vercel-handler.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    target: 'es2022',
    banner: {
      js: '// @ts-nocheck\n/* Auto-generated standalone Vercel Serverless Function bundle */'
    },
    outfile: 'api/index.ts'
  });

  const content = fs.readFileSync('api/index.ts', 'utf8');
  console.log(`✅ api/index.ts generated successfully (${(content.length / 1024 / 1024).toFixed(2)} MB)`);

  // Verification checks
  const relativeImportMatches = content.match(/from\s+['"]\.\.?[^'"]*['"]/g);
  if (relativeImportMatches) {
    console.error('❌ ERROR: Found unresolved relative imports in api/index.ts:', relativeImportMatches);
    process.exit(1);
  } else {
    console.log('✅ Verified: ZERO relative imports in api/index.ts');
  }

  const forbiddenPatterns = [
    '/var/task/server',
    '/var/task/src/server/app',
    '../server',
    '../src/server/app'
  ];

  for (const pat of forbiddenPatterns) {
    if (content.includes(pat)) {
      console.error(`❌ ERROR: Found forbidden pattern "${pat}" in api/index.ts!`);
      process.exit(1);
    }
  }

  console.log('✅ Verified: No unresolved server paths in api/index.ts');
}

bundleApi().catch(err => {
  console.error('❌ Bundling failed:', err);
  process.exit(1);
});
