# Soroban Webauthn Account Contract

| :warning: Code in this repo is demo material only. It has not been audited. Do not use to hold, protect, or secure anything. |
|-----------------------------------------|

This repo contains [Soroban] contracts that demonstrate account abstraction on [Stellar], by supporting [Webauthn].

Contracts:

- `contract-webauthn-factory` – A Soroban factory contract that deploys and initializes new deployments of webauthn contract accounts.
- `contract-webauthn-secp256r1` – A Soroban account contract that is initialized with a ecdsa secp256r1 public key for a Webauthn device (passkey from a browser, computer, phone, Yubikey, etc). This contract acts as an account on network, holding assets, etc, and is controlled by the Webauthn device's signatures.

Also:

[Stellar]: https://stellar.org
[Soroban]: https://soroban.stellar.org
[Webauthn]: https://www.w3.org/TR/webauthn-2/
