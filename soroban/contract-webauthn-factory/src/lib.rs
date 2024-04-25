#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Address, BytesN, Env};

#[contract]
pub struct Contract;

// TODO wasm_hash should be saved to instance via an init function so you don't have to pass it when deploying a new abstract account

#[contractimpl]
impl Contract {
    pub fn deploy(env: Env, salt: BytesN<32>, pk: BytesN<65>, wasm_hash: BytesN<32>) -> Address {
        let address = env.deployer().with_current_contract(salt).deploy(wasm_hash);
        let () = env.invoke_contract(&address, &symbol_short!("init"), vec![&env, pk.to_val()]);

        env.storage().instance().extend_ttl(3110400, 3110400);
        
        address
    }
}
