import fs from 'fs';
let code = fs.readFileSync('/Volumes/MAC/Thai_Community/server/index.ts', 'utf8');

if (!code.includes('/api/disaster-mode')) {
  const endpointCode = `
      // Change Disaster Mode
      if (url.pathname === '/api/disaster-mode' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const mode = body.mode;
          if (['flood', 'earthquake', 'wildfire', 'tsunami'].includes(mode)) {
            currentDisasterMode = mode;
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json({ success: true, mode, state });
          }
          return json({ error: 'Invalid mode' }, 400);
        })();
      }
`;
  code = code.replace('// Citizen Voice/Text SOS', endpointCode + '\n      // Citizen Voice/Text SOS');
  fs.writeFileSync('/Volumes/MAC/Thai_Community/server/index.ts', code);
}
