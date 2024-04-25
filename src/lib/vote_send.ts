import { PUBLIC_rpcUrl, PUBLIC_horizonUrl } from "$env/static/public";
import { Memo, Operation, SorobanRpc, Transaction, xdr, type Keypair, type MemoType } from "@stellar/stellar-sdk";
import base64url from "base64url";

export async function handleVoteSend(bundlerKey: Keypair, authTxn: Transaction<Memo<MemoType>, Operation[]>, lastLedger: number, signRes: any) {
    const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl, { allowHttp: true });

    const signatureRaw = base64url.toBuffer(signRes.response.signature);
    const signature = convertEcdsaSignatureAsnToCompact(signatureRaw);

    const op = authTxn.operations[0] as Operation.InvokeHostFunction
    const creds = op.auth?.[0].credentials().address()!

    creds.signatureExpirationLedger(lastLedger + 100)
    creds.signature(xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('authenticator_data'),
            val: xdr.ScVal.scvBytes(base64url.toBuffer(signRes.response.authenticatorData)),
        }),
        new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('client_data_json'),
            val: xdr.ScVal.scvBytes(base64url.toBuffer(signRes.response.clientDataJSON)),
        }),
        new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('signature'),
            val: xdr.ScVal.scvBytes(signature),
        }),
    ]))

    const sim = await rpc.simulateTransaction(authTxn)

    if (
        SorobanRpc.Api.isSimulationError(sim)
        || SorobanRpc.Api.isSimulationRestore(sim)
    ) throw sim

    const transaction = SorobanRpc.assembleTransaction(authTxn, sim)
        .setTimeout(30)
        .build()

    transaction.sign(bundlerKey)

    const txResp = await (await fetch(`${PUBLIC_horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'tx': transaction.toXDR() }),
    })).json();

    if (txResp.successful) {
        console.log(txResp);
    } else {
        throw txResp;
    }
}

function convertEcdsaSignatureAsnToCompact(sig: Buffer) {
    // ASN Sequence
    let offset = 0;
    if (sig[offset] != 0x30) {
        throw "signature is not a sequence";
    }
    offset += 1;

    // ASN Sequence Byte Length
    offset += 1;

    // ASN Integer (R)
    if (sig[offset] != 0x02) {
        throw "first element in sequence is not an integer";
    }
    offset += 1;

    // ASN Integer (R) Byte Length
    const rLen = sig[offset];
    offset += 1;

    // ASN Integer (R) Byte Value
    if (rLen >= 33) {
        if (rLen != 33 || sig[offset] != 0x00) {
            throw "can only handle larger than 32 byte R's that are len 33 and lead with zero";
        }
        offset += 1;
    }
    const r = sig.slice(offset, offset + 32);
    offset += 32;

    // ASN Integer (S)
    if (sig[offset] != 0x02) {
        throw "second element in sequence is not an integer";
    }
    offset += 1;

    // ASN Integer (S) Byte Length
    const sLen = sig[offset];
    offset += 1;

    // ASN Integer (S) Byte Value
    if (sLen >= 33) {
        if (sLen != 33 || sig[offset] != 0x00) {
            throw "can only handle larger than 32 byte R's that are len 33 and lead with zero";
        }
        offset += 1;
    }

    const s = sig.slice(offset, offset + 32);

    offset += 32;

    const signature64 = Buffer.from([...r, ...s]);

    return signature64;
}