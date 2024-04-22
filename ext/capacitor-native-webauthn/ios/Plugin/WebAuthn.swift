import Foundation

@objc public class WebAuthn: NSObject {
    private var credentialManager: String = ""
    
    @objc public func isWebAuthnAvailable() -> Bool {
        return isAvailable(WebAuthnTypes.WEBAUTHN)
    }
    
    @objc public func isWebAuthnAutoFillAvailable() -> Bool {
        return isAvailable(WebAuthnTypes.WEBAUTHNAUTOFILL);
    }
    
    @objc public func setCredentialManager(_ credentialManager: String) {
        self.credentialManager = credentialManager
    }
    
    @objc public func getCredentialManager() -> String {
        return self.credentialManager
    }
    
    private func isAvailable(_ webAuthnType: WebAuthnTypes) -> Bool {
        var val:Bool = false
        switch webAuthnType {
        case .WEBAUTHN:
            val = false
        case .WEBAUTHNAUTOFILL:
            val = false
        }
        return val
    }
}
