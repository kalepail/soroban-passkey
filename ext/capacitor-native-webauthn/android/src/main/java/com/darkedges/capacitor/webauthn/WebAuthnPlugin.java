package com.darkedges.capacitor.webauthn;

import android.os.CancellationSignal;
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPasswordOption;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.PasswordCredential;
import androidx.credentials.PublicKeyCredential;
import androidx.credentials.exceptions.CreateCredentialCancellationException;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.exceptions.CreateCredentialInterruptedException;
import androidx.credentials.exceptions.CreateCredentialProviderConfigurationException;
import androidx.credentials.exceptions.CreateCredentialUnknownException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;


@CapacitorPlugin(name = "WebAuthn")
public class WebAuthnPlugin extends Plugin {
    private final WebAuthn implementation = new WebAuthn();
    ActivityResultLauncher createCredentialIntentLauncher;

    @Override
    public void load() {
        super.load();
        // Use your app or activity context to instantiate a client instance of CredentialManager.
        implementation.setCredentialManager(CredentialManager.create(bridge.getActivity().getApplicationContext()));
    }

    @PluginMethod
    public void isWebAuthnAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", implementation.isWebAuthnAvailable());
        call.resolve(ret);
    }

    @PluginMethod
    public void isWebAuthnAutoFillAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", implementation.isWebAuthnAutoFillAvailable());
        call.resolve(ret);
    }

    @PluginMethod
    public void startAuthentication(PluginCall call) {
        String requestJson = call.getData().toString();
        // Retrieves the user's saved password for your app from their
        // password provider.
        GetPasswordOption getPasswordOption = new GetPasswordOption();

        // Get webauthns from the user's public key credential provider.
        String clientDataHash = null;
        GetPublicKeyCredentialOption getPublicKeyCredentialOption =
                new GetPublicKeyCredentialOption(requestJson, null);
        GetCredentialRequest getCredRequest = new GetCredentialRequest.Builder()
                .addCredentialOption(getPasswordOption)
                .addCredentialOption(getPublicKeyCredentialOption)
                .build();
        CancellationSignal cancellationSignal = null;
        implementation.getCredentialManager().getCredentialAsync(
                getActivity(),
                getCredRequest,
                cancellationSignal,
                getContext().getMainExecutor(),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        // Handle the successfully returned credential.
                        Credential credential = result.getCredential();
                        if (credential instanceof PublicKeyCredential) {
                            String responseJson = ((PublicKeyCredential) credential).getAuthenticationResponseJson();
                            fidoAuthenticateToServer(call, responseJson);
                        } else if (credential instanceof PasswordCredential) {
                            String id = ((PasswordCredential) credential).getId();
                            String password = ((PasswordCredential) credential).getPassword();
                            firebaseSignInWithPassword(call, id, password);
                        } else {
                            Log.v("TAG", "credential: "+credential.getData());
                            handlePasskeyError(call, "Unexpected type of credential", credential.getClass().getName());
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        handlePasskeyError(call, "Sign in failed with exception", e.getMessage());
                    }
                }
        );
    }

    @PluginMethod
    public void startRegistration(PluginCall call) {
        String requestJson = call.getData().toString();
        String clientDataHash = null;
        CreatePublicKeyCredentialRequest createPublicKeyCredentialRequest =
                // `requestJson` contains the request in JSON format. Uses the standard
                // WebAuthn web JSON spec.
                // `preferImmediatelyAvailableCredentials` defines whether you prefer
                // to only use immediately available credentials, not  hybrid credentials,
                // to fulfill this request. This value is false by default.
                new CreatePublicKeyCredentialRequest(requestJson, null, true);
        // Execute CreateCredentialRequest asynchronously to register credentials
        // for a user account. Handle success and failure cases with the result and
        // exceptions, respectively.
        CancellationSignal cancellationSignal = null;
        implementation.getCredentialManager().createCredentialAsync(getActivity(), createPublicKeyCredentialRequest, cancellationSignal, getContext().getMainExecutor(),
                new CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
                    @Override
                    public void onResult(CreateCredentialResponse result) {
                        handleSuccessfulCreatePasskeyResult(call, result);
                    }

                    @Override
                    public void onError(CreateCredentialException e) {
                        if (e instanceof CreatePublicKeyCredentialDomException) {
                            // Handle the webauthn DOM errors thrown according to the
                            // WebAuthn spec.
                            handlePasskeyError(call, "CreatePublicKeyCredentialDomException", ((CreatePublicKeyCredentialDomException)e).getMessage());
                        } else if (e instanceof CreateCredentialCancellationException) {
                            // The user intentionally canceled the operation and chose not
                            // to register the credential.
                            handlePasskeyError(call, "CreateCredentialCancellationException", ((CreateCredentialCancellationException)e).getMessage());
                        } else if (e instanceof CreateCredentialInterruptedException) {
                            // Retry-able error. Consider retrying the call.
                            handlePasskeyError(call, "CreateCredentialInterruptedException", ((CreateCredentialInterruptedException)e).getMessage());
                        } else if (e instanceof CreateCredentialProviderConfigurationException) {
                            // Your app is missing the provider configuration dependency.
                            // Most likely, you're missing the
                            // "credentials-play-services-auth" module.
                            handlePasskeyError(call, "CreateCredentialProviderConfigurationException", ((CreateCredentialProviderConfigurationException)e).getMessage());
                        } else if (e instanceof CreateCredentialUnknownException) {
                            handlePasskeyError(call, "CreateCredentialUnknownException", ((CreateCredentialUnknownException)e).getMessage());
                        } else {
                            handlePasskeyError(call, "Unexpected exception type", e.getMessage());
                        }
                    }
                });
    }

    private void firebaseSignInWithPassword(PluginCall call, String id, String password) {
        handlePasskeyError(call, "Unexpected type of credential", "Firebase Credentials found.");
    }

    private void fidoAuthenticateToServer(PluginCall call, String responseJson) {
        JSObject ret = null;
        try {
            ret = new JSObject(responseJson);
        } catch (JSONException e) {
            call.reject("Failed to get webauthn", e);
        }
        call.resolve(ret);
    }

    private void handlePasskeyError(PluginCall call, String type, String e) {
        JSObject ret = new JSObject();
        ret.put(type, e);
        call.reject(e, ret);
    }

    //  @SuppressLint("RestrictedApi")
    private void handleSuccessfulCreatePasskeyResult(PluginCall call, CreateCredentialResponse createCredentialResponse) {
        JSObject ret = null;
        try {
            ret = new JSObject(createCredentialResponse.getData().getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON"));
        } catch (JSONException e) {
            call.reject("Failed to get webauthn", e);
        }
        call.resolve(ret);
    }
}
