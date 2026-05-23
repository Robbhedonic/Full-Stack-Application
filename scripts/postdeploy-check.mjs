#!/usr/bin/env node

const baseUrlInput = process.argv[2] || process.env.APP_URL;

if (!baseUrlInput) {
  console.error('Usage: node scripts/postdeploy-check.mjs <base-url>');
  console.error('Example: node scripts/postdeploy-check.mjs https://your-app.up.railway.app');
  process.exit(1);
}

const baseUrl = new URL(baseUrlInput);

const checks = [
  {
    name: 'Frontend root',
    path: '/',
    validate: async (response) => {
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        throw new Error(`Expected 2xx but got ${response.status}`);
      }
      if (!contentType.includes('text/html')) {
        throw new Error(`Expected text/html but got ${contentType || 'unknown'}`);
      }
    },
  },
  {
    name: 'Backend health',
    path: '/api/health',
    validate: async (response) => {
      if (!response.ok) {
        throw new Error(`Expected 2xx but got ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(`Expected status "ok" but got ${JSON.stringify(data)}`);
      }
    },
  },
];

let failed = false;

for (const check of checks) {
  const url = new URL(check.path, baseUrl).toString();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json,text/html',
      },
    });

    await check.validate(response);
    console.log(`PASS ${check.name}: ${url}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.name}: ${url}`);
    console.error(`  ${error.message}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('All post-deploy checks passed.');
