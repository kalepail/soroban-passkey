import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/types';
export interface WebAuthnPlugin {
    isWebAuthnAvailable(): Promise<{
        value: boolean;
    }>;
    isWebAuthnAutoFillAvailable(): Promise<{
        value: boolean;
    }>;
    startRegistration(publicKeyCredentialCreationOptionsJSON: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON>;
    startAuthentication(requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON, useBrowserAutofill?: boolean): Promise<AuthenticationResponseJSON>;
}
