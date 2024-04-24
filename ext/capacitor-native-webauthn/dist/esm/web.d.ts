import { WebPlugin } from '@capacitor/core';
import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/types';
import type { WebAuthnPlugin } from './definitions';
export declare class WebAuthnWeb extends WebPlugin implements WebAuthnPlugin {
    startRegistration(publicKeyCredentialCreationOptionsJSON: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON>;
    startAuthentication(requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON, useBrowserAutofill?: boolean): Promise<AuthenticationResponseJSON>;
    isWebAuthnAvailable(): Promise<{
        value: boolean;
    }>;
    isWebAuthnAutoFillAvailable(): Promise<{
        value: boolean;
    }>;
    private isAvailable;
}
