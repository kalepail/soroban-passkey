import { WebPlugin } from '@capacitor/core';
import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, startAuthentication, startRegistration } from '@simplewebauthn/browser';
export class WebAuthnWeb extends WebPlugin {
    async startRegistration(publicKeyCredentialCreationOptionsJSON) {
        let res;
        try {
            res = await startRegistration(publicKeyCredentialCreationOptionsJSON);
        }
        catch (error) {
            return Promise.reject(error);
        }
        return Promise.resolve(res);
    }
    async startAuthentication(requestOptionsJSON, useBrowserAutofill) {
        let res;
        try {
            res = await startAuthentication(requestOptionsJSON, useBrowserAutofill);
        }
        catch (error) {
            return Promise.reject(error);
        }
        return Promise.resolve(res);
    }
    async isWebAuthnAvailable() {
        return this.isAvailable('webauthn');
    }
    async isWebAuthnAutoFillAvailable() {
        return this.isAvailable('webauthnautofill');
    }
    async isAvailable(type) {
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
//# sourceMappingURL=web.js.map