import { PUBLIC_rpcUrl, PUBLIC_factoryContractId, PUBLIC_horizonUrl, PUBLIC_networkPassphrase } from "$env/static/public";
import { Keypair, StrKey, xdr, hash, Address, Account, TransactionBuilder, Operation, SorobanRpc } from "@stellar/stellar-sdk"

export async function handleDeploy(bundlerKey: Keypair, contractSalt: Buffer, publicKey?: Buffer) {
    const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl);
    const deployee = StrKey.encodeContract(hash(xdr.HashIdPreimage.envelopeTypeContractId(
        new xdr.HashIdPreimageContractId({
            networkId: hash(Buffer.from(PUBLIC_networkPassphrase, 'utf-8')),
            contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                new xdr.ContractIdPreimageFromAddress({
                    address: Address.fromString(PUBLIC_factoryContractId).toScAddress(),
                    salt: contractSalt,
                })
            )
        })
    ).toXDR()));

    // This is a signup deploy vs a signin deploy. Look up if this contract has been already been deployed, otherwise fail
    if (!publicKey) {
        await rpc.getContractData(deployee, xdr.ScVal.scvLedgerKeyContractInstance())
        return deployee
    }

    const bundlerKeyAccount = await rpc.getAccount(bundlerKey.publicKey()).then((res) => new Account(res.accountId(), res.sequenceNumber()))
    const simTxn = new TransactionBuilder(bundlerKeyAccount, {
        fee: '100',
        networkPassphrase: PUBLIC_networkPassphrase
    })
        .addOperation(
            Operation.invokeContractFunction({
                contract: PUBLIC_factoryContractId,
                function: 'deploy',
                args: [
                    xdr.ScVal.scvBytes(contractSalt),
                    xdr.ScVal.scvBytes(publicKey),
                ]
            })
        )
        .setTimeout(0)
        .build();

    const sim = await rpc.simulateTransaction(simTxn)

    if (
        SorobanRpc.Api.isSimulationError(sim)
        || SorobanRpc.Api.isSimulationRestore(sim)
    ) throw sim

    const transaction = SorobanRpc.assembleTransaction(simTxn, sim).setTimeout(0).build()

    transaction.sign(bundlerKey);

    // TODO failure here is resulting in sp:deployee undefined
    // TODO handle archived entries

    const txResp = await (await fetch(`${PUBLIC_horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'tx': transaction.toXDR() }),
    })).json();

    if (txResp.successful) {
        return deployee
    } else {
        throw txResp
    }
}
