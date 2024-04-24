
import { PUBLIC_networkPassphrase, PUBLIC_horizonUrl, PUBLIC_chickenVsEggContractId } from "$env/static/public";
import { Address, SorobanRpc, hash, xdr } from "@stellar/stellar-sdk";

// TODO Clean up this code and reduce the duplicated code we pass to vote_send

export async function handleVoteBuild(accountContractId: string, vote: boolean) {
    const rpc = new SorobanRpc.Server(`${PUBLIC_horizonUrl}/soroban/rpc`, { allowHttp: true });
    const lastLedger = await rpc.getLatestLedger().then(({ sequence }) => sequence)

    const argSource = xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress());
    const argVote = xdr.ScVal.scvBool(vote);
    const invocationArgs = new xdr.InvokeContractArgs({
        contractAddress: Address.fromString(PUBLIC_chickenVsEggContractId).toScAddress(),
        functionName: "vote",
        args: [argSource, argVote],
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