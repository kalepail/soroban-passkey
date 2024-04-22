import { WebPlugin } from '@capacitor/core';
import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/types';

import type { WebAuthnPlugin } from './definitions';

export class WebAuthnWeb extends WebPlugin implements WebAuthnPlugin {

  async startRegistration(publicKeyCredentialCreationOptionsJSON: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> {
    let res;
    try {
      res = await startRegistration(publicKeyCredentialCreationOptionsJSON);
    } catch (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(res)
  }

  async startAuthentication(requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON, useBrowserAutofill?: boolean): Promise<AuthenticationResponseJSON> {
    let res;
    try {
      res = await startAuthentication(requestOptionsJSON, useBrowserAutofill);
    } catch (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(res)
  }

  async isWebAuthnAvailable(): Promise<{ value: boolean }> {
    return this.isAvailable('webauthn');
  }

  async isWebAuthnAutoFillAvailable(): Promise<{ value: boolean }> {
    return this.isAvailable('webauthnautofill');
  }

  private async isAvailable(type: 'webauthn' | 'webauthnautofill'): Promise<{ value: boolean }> {
    let val = false;
    if (type === 'webauthn') {
      val = await browserSupportsWebAuthn();
    }
    if (type === 'webauthnautofill') {
      val = await browserSupportsWebAuthnAutofill();
    }
    return Promise.resolve({ value: val });
  }

}
