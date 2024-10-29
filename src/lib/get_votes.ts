import { PUBLIC_rpcUrl, PUBLIC_chickenVsEggContractId, PUBLIC_networkPassphrase } from "$env/static/public";
import { xdr, Address, Operation, TransactionBuilder, Account, scValToNative, SorobanRpc, StrKey } from "@stellar/stellar-sdk/minimal";

export async function getVotes(accountContractId: string) {
    const op = Operation.invokeContractFunction({
        contract: PUBLIC_chickenVsEggContractId,
        function: 'votes',
        args: [
            xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress())
        ]
    })

    const source = new Account(StrKey.encodeEd25519PublicKey(Buffer.alloc(32)), '0')
    const transaction = new TransactionBuilder(source, {
        fee: '0',
        networkPassphrase: PUBLIC_networkPassphrase
    })
        .addOperation(op)
        .setTimeout(0)
        .build();

    const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl);

    const simResp = await rpc.simulateTransaction(transaction)

    if (!SorobanRpc.Api.isSimulationSuccess(simResp)) {
        throw simResp;
    } else {
        const [all_votes, source_votes]: [{ chicken: number, egg: number }, { chicken: number, egg: number }] = scValToNative(simResp.result?.retval!)
        const total_all_votes = all_votes.chicken + all_votes.egg

        return {
            all_votes: {
                ...all_votes,
                chicken_percent: all_votes.chicken / total_all_votes * 100,
                egg_percent: all_votes.egg / total_all_votes * 100,
                chicken_percent_no_source: (all_votes.chicken - source_votes.chicken) / total_all_votes * 100,
                egg_percent_no_source: (all_votes.egg - source_votes.egg) / total_all_votes * 100
            },
            source_votes: {
                ...source_votes,
                chicken_percent: source_votes.chicken / total_all_votes * 100,
                egg_percent: source_votes.egg / total_all_votes * 100
            },
            total_source_votes: source_votes.chicken + source_votes.egg,
            total_all_votes
        };
    }
}