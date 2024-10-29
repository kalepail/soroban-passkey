# export SOROBAN_RPC_URL=http://67.205.175.159:8000/soroban/rpc
# export SOROBAN_NETWORK_PASSPHRASE=Standalone Network ; February 2017
export SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
export SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
export SOROBAN_ACCOUNT=default
export WEBAUTHN_FACTORY=CD5QFGMCJ7CAL77GPTJ5MYABV6N3T4D7677S27ZOMC5B76BK4OBHJKKQ
export WEBAUTHN_WASM=142dce5bf1e46bb925ea72a3b09d58419307a53a2acc347338cb82713ccf5c47

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