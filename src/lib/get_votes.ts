import { PUBLIC_horizonUrl, PUBLIC_chickenVsEggContractId, PUBLIC_networkPassphrase } from "$env/static/public";
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

    const rpc = new SorobanRpc.Server(`${PUBLIC_horizonUrl}/soroban/rpc`, { allowHttp: true });

    const simResp = await rpc.simulateTransaction(transaction)

    if (!SorobanRpc.Api.isSimulationSuccess(simResp)) {
        console.error(simResp);
    } else {
        return scValToNative(simResp.result?.retval!);
    }
}