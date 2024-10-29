
import { PUBLIC_rpcUrl, PUBLIC_networkPassphrase, PUBLIC_chickenVsEggContractId } from "$env/static/public";
import { Account, Address, Operation, SorobanRpc, StrKey, TransactionBuilder, xdr } from "@stellar/stellar-sdk/minimal";

export async function handleVoteBuild(accountContractId: string, vote: boolean) {
    const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl);
    const source = new Account(StrKey.encodeEd25519PublicKey(Buffer.alloc(32)), '0');
    const simTxn = new TransactionBuilder(source, {
        fee: '0',
        networkPassphrase: PUBLIC_networkPassphrase
    })
        .addOperation(Operation.invokeContractFunction({
            contract: PUBLIC_chickenVsEggContractId,
            function: 'vote',
            args: [
                Address.fromString(accountContractId).toScVal(),
                xdr.ScVal.scvBool(vote)
            ]
        }))
        .setTimeout(0)
        .build()

    const sim = await rpc.simulateTransaction(simTxn)

    if (
        SorobanRpc.Api.isSimulationError(sim)
        || SorobanRpc.Api.isSimulationRestore(sim)
    ) throw sim

    return SorobanRpc.assembleTransaction(simTxn, sim).build()
}