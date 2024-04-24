#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Address, Bytes, BytesN, Env};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn deploy(e: Env, pk: Bytes, wasm_hash: BytesN<32>) -> Address {
        let salt = e.crypto().sha256(&pk);
        let address = e.deployer().with_current_contract(salt).deploy(wasm_hash);
        let () = e.invoke_contract(&address, &symbol_short!("init"), vec![&e, pk.to_val()]);
        address
    }
}
