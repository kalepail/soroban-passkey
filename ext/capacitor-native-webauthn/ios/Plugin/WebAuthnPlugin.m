#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(WebAuthnPlugin, "WebAuthn", 
           CAP_PLUGIN_METHOD(isWebAuthnAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isWebAuthnAutoFillAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startRegistration, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startAuthentication, CAPPluginReturnPromise);
)
