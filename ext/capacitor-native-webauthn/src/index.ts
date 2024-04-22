import { registerPlugin } from '@capacitor/core';

import type { WebAuthnPlugin } from './definitions';

const WebAuthn = registerPlugin<WebAuthnPlugin>('WebAuthn', {
  web: () => import('./web').then(m => new m.WebAuthnWeb()),
});

export * from './definitions';
export { WebAuthn };
