
import { PUBLIC_networkPassphrase, PUBLIC_horizonUrl, PUBLIC_nativeContractId } from "$env/static/public";
import { Address, hash, nativeToScVal, xdr, type Keypair } from "@stellar/stellar-sdk";

export async function handleRefundBuild(bundlerKey: Keypair, accountContractId: string) {
    const ledgerResp = await (await fetch(`${PUBLIC_horizonUrl}/ledgers/?order=desc&limit=1`)).json();
    const lastLedger = ledgerResp._embedded.records[0].sequence;

    const fnName = "transfer";
    const argFrom = xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress());
    const argTo = xdr.ScVal.scvAddress(Address.fromString(bundlerKey.publicKey()).toScAddress());
    const argAmount = nativeToScVal(1000000000, { type: 'i128' });
    const invocationArgs = new xdr.InvokeContractArgs({
        contractAddress: Address.fromString(PUBLIC_nativeContractId).toScAddress(),
        functionName: fnName,
        args: [argFrom, argTo, argAmount],
    });
    const invocation = new xdr.SorobanAuthorizedInvocation({
        function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(invocationArgs),
        subInvocations: [],
    });
    const nonce = new xdr.Int64(Date.now());
    const signatureExpirationLedger = lastLedger + 100;

    const authHash = hash(
        xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
            new xdr.HashIdPreimageSorobanAuthorization({
                networkId: hash(Buffer.from(PUBLIC_networkPassphrase, 'utf-8')),
                invocation,
                nonce,
                signatureExpirationLedger,
            })
        ).toXDR()
    );

    return {
        lastLedger,
        nonce,
        authHash
    }
}