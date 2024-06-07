# export SOROBAN_RPC_URL=http://67.205.175.159:8000/soroban/rpc
# export SOROBAN_NETWORK_PASSPHRASE=Standalone Network ; February 2017
export SOROBAN_RPC_URL=https://rpc-futurenet.stellar.org
export SOROBAN_NETWORK_PASSPHRASE=Test SDF Future Network ; October 2022
export SOROBAN_ACCOUNT=default
export WEBAUTHN_FACTORY=CCZWIOWKT4WGJQHWZFF7ARCQJFVWRXPOKG4WGY6DOZ72OHZEMKXAEGRO
export WEBAUTHN_WASM=23d8e1fbdb0bb903815feb7d07b675db98b5376feedab056aab61910d41e80c1

build:
	@cd contract-chicken-v-egg && soroban contract build --out-dir ../out
	@cd contract-webauthn-factory && soroban contract build --out-dir ../out
	@cd contract-webauthn-secp256r1 && soroban contract build --out-dir ../out

	soroban contract optimize --wasm ./out/chicken_v_egg.wasm
	soroban contract optimize --wasm ./out/webauthn_factory.wasm
	soroban contract optimize --wasm ./out/webauthn_account_secp256r1.wasm

	ls -lah out/*.optimized.wasm

deploy:
	soroban keys fund $(SOROBAN_ACCOUNT) || true
	soroban contract asset deploy --asset native || true
	soroban contract deploy --wasm ./out/chicken_v_egg.optimized.wasm
	soroban contract deploy --wasm ./out/webauthn_factory.optimized.wasm
	soroban contract install --wasm ./out/webauthn_account_secp256r1.optimized.wasm

fmt:
	@cd contract-chicken-v-egg && cargo fmt --all
	@cd contract-webauthn-factory && cargo fmt --all
	@cd contract-webauthn-secp256r1 && cargo fmt --all

clean:
	@cd contract-chicken-v-egg && cargo clean
	@cd contract-webauthn-factory && cargo clean
	@cd contract-webauthn-secp256r1 && cargo clean

init:
	soroban contract invoke --id $(WEBAUTHN_FACTORY) -- init --wasm_hash $(WEBAUTHN_WASM)