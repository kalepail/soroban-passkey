#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

const VOTES: Symbol = symbol_short!("votes");

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Votes {
    pub chicken: u32,
    pub egg: u32,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn extend_ttl(env: Env) {
        let max_ttl = env.storage().max_ttl();
        let contract_address = env.current_contract_address();

        env.storage().instance().extend_ttl(max_ttl, max_ttl);
        env.deployer()
            .extend_ttl(contract_address.clone(), max_ttl, max_ttl);
        env.deployer()
            .extend_ttl_for_code(contract_address.clone(), max_ttl, max_ttl);
        env.deployer()
            .extend_ttl_for_contract_instance(contract_address.clone(), max_ttl, max_ttl);
    }
    pub fn vote(env: Env, source: Address, vote: bool) -> (Votes, Votes) {
        source.require_auth();

        let all_votes = env
            .storage()
            .instance()
            .get(&VOTES)
            .unwrap_or(Votes { chicken: 0, egg: 0 });

        let source_votes = env
            .storage()
            .persistent()
            .get(&(VOTES, &source))
            .unwrap_or(Votes { chicken: 0, egg: 0 });

        let all_votes = if vote {
            Votes {
                chicken: all_votes.chicken + 1,
                egg: all_votes.egg,
            }
        } else {
            Votes {
                chicken: all_votes.chicken,
                egg: all_votes.egg + 1,
            }
        };

        let source_votes = if vote {
            Votes {
                chicken: source_votes.chicken + 1,
                egg: source_votes.egg,
            }
        } else {
            Votes {
                chicken: source_votes.chicken,
                egg: source_votes.egg + 1,
            }
        };

        let max_ttl = env.storage().max_ttl();

        env.storage().instance().set(&VOTES, &all_votes);
        env.storage()
            .persistent()
            .set(&(VOTES, &source), &source_votes);

        env.storage()
            .persistent()
            .extend_ttl(&(VOTES, &source), max_ttl, max_ttl);
        Self::extend_ttl(env);

        (all_votes, source_votes)
    }
    pub fn votes(env: Env, source: Address) -> (Votes, Votes) {
        (
            env.storage()
                .instance()
                .get(&VOTES)
                .unwrap_or(Votes { chicken: 0, egg: 0 }),
            env.storage()
                .persistent()
                .get(&(VOTES, &source))
                .unwrap_or(Votes { chicken: 0, egg: 0 }),
        )
    }
}
