import { PUBLIC_horizonUrl, PUBLIC_nativeContractId, PUBLIC_networkPassphrase } from "$env/static/public";
import { Keypair, xdr, Address, nativeToScVal, Operation, TransactionBuilder, Account, SorobanDataBuilder, StrKey } from "@stellar/stellar-sdk";

// TODO clean up this code

export async function handleFund(bundlerKey: Keypair, accountContractId: string) {
    const key = bundlerKey;
    const accResp = await (await fetch(`${PUBLIC_horizonUrl}/accounts/${key.publicKey()}`)).json();

    const fnName = "transfer";
    const argFrom = xdr.ScVal.scvAddress(Address.fromString(bundlerKey.publicKey()).toScAddress());
    const argTo = xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress());
    const argAmount = nativeToScVal(10000000000, { type: 'i128' });
    const invocation = new xdr.InvokeContractArgs({
        contractAddress: Address.fromString(PUBLIC_nativeContractId).toScAddress(),
        functionName: fnName,
        args: [argFrom, argTo, argAmount],
    });
    const op = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(invocation),
        auth: [new xdr.SorobanAuthorizationEntry({
            rootInvocation: new xdr.SorobanAuthorizedInvocation({
                function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(invocation),
                subInvocations: [],
            }),
            credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
        })],
    });

    const transaction = new TransactionBuilder(
        new Account(key.publicKey(), accResp.sequence),
        { fee: '218089', networkPassphrase: PUBLIC_networkPassphrase },
    )
        .addOperation(op)
        .setTimeout(30)
        .setSorobanData(new SorobanDataBuilder()
            .setFootprint(
                // Read
                [
                    // Contract instance for contract being called.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.fromString(PUBLIC_nativeContractId).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyContractInstance(),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                ],
                // Write
                [
                    // Sender account.
                    xdr.LedgerKey.account(
                        new xdr.LedgerKeyAccount({
                            accountId: bundlerKey.xdrAccountId(),
                        })
                    ),
                    // Receiver balance.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.contract(StrKey.decodeContract(PUBLIC_nativeContractId)).toScAddress(),
                            key: xdr.ScVal.scvVec([
                                nativeToScVal("Balance", { type: 'symbol' }),
                                xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress()),
                            ]),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                ],
            )
            .setResources(
                404314, // Instructions
                712, // Read Bytes
                368, // Write Bytes
            )
            .setResourceFee(84669)
            .build())
        .build();

    transaction.sign(key);

    const signed = transaction.toXDR();
    const txResp = await (await fetch(`${PUBLIC_horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'tx': signed }),
    })).json();

    if (txResp.successful) {
        console.log(txResp);
    } else {
        console.error(txResp);
    }
}  