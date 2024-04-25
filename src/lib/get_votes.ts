import { PUBLIC_rpcUrl, PUBLIC_horizonUrl, PUBLIC_chickenVsEggContractId, PUBLIC_networkPassphrase } from "$env/static/public";
import { SorobanRpc } from "@stellar/stellar-sdk";
import { Keypair, xdr, Address, Operation, TransactionBuilder, Account, scValToNative } from "@stellar/stellar-sdk";

export async function getVotes(bundlerKey: Keypair, accountContractId: string) {
    const key = bundlerKey;

    const op = Operation.invokeContractFunction({
        contract: PUBLIC_chickenVsEggContractId,
        function: 'votes',
        args: [
            xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress())
        ]
    })

    const transaction = new TransactionBuilder(
        new Account(key.publicKey(), '0'),
        { fee: '0', networkPassphrase: PUBLIC_networkPassphrase },
    )
        .addOperation(op)
        .setTimeout(0)
        .build();

    const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl);

    const simResp = await rpc.simulateTransaction(transaction)

    if (!SorobanRpc.Api.isSimulationSuccess(simResp)) {
        throw simResp;
    } else {
        const [all_votes, source_votes]: [{chicken: number, egg: number}, {chicken: number, egg: number}] = scValToNative(simResp.result?.retval!)
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