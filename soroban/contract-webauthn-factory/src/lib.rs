#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, symbol_short, vec, Address, BytesN, Env, Symbol,
};

#[contract]
pub struct Contract;

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq, Debug)]
pub enum Error {
    NotInited = 1,
    AlreadyInited = 2,
}

const STORAGE_KEY_WASM_HASH: Symbol = symbol_short!("hash");

#[contractimpl]
impl Contract {
    pub fn init(env: Env, wasm_hash: BytesN<32>) -> Result<(), Error> {
        if env.storage().instance().has(&STORAGE_KEY_WASM_HASH) {
            return Err(Error::AlreadyInited);
        }

        env.storage()
            .instance()
            .set(&STORAGE_KEY_WASM_HASH, &wasm_hash);
        env.storage().instance().extend_ttl(3110400, 3110400);

        Ok(())
    }
    pub fn deploy(env: Env, salt: BytesN<32>, pk: BytesN<65>) -> Result<Address, Error> {
        let wasm_hash = env
            .storage()
            .instance()
            .get::<Symbol, BytesN<32>>(&STORAGE_KEY_WASM_HASH)
            .ok_or(Error::NotInited)?;

        let address = env.deployer().with_current_contract(salt).deploy(wasm_hash);
        let () = env.invoke_contract(&address, &symbol_short!("init"), vec![&env, pk.to_val()]);

        env.storage().instance().extend_ttl(3110400, 3110400);

        Ok(address)
    }
}
