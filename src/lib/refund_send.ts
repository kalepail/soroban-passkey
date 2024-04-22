import { PUBLIC_networkPassphrase, PUBLIC_accountSecp256r1ContractWasm, PUBLIC_horizonUrl, PUBLIC_nativeContractId } from "$env/static/public";
import { Account, Address, Operation, SorobanDataBuilder, TransactionBuilder, nativeToScVal, xdr, type Keypair } from "@stellar/stellar-sdk";
import base64url from "base64url";

export async function handleRefundSend(bundlerKey: Keypair, accountContractId: string, lastLedger: any, nonce: xdr.Int64, credentialAuth: any) {
    const argWasmHash = hexToUint8Array(PUBLIC_accountSecp256r1ContractWasm);
    const key = bundlerKey;
    const accResp = await (await fetch(`${PUBLIC_horizonUrl}/accounts/${key.publicKey()}`)).json();

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
    const signatureExpirationLedger = lastLedger + 100;

    //   "response": {
    //     "signature": "MEYCIQDvk21ZrkfTuG6YtNsYtIOoztvz5fmjoWIauaDkzLjLIwIhALSDV9Goi9pSNx1eMXXCldpdA1aT2oCbbr0FBDe5pmIn",
    //     "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiU0dWc2JHOGdWMjl5YkdRIiwib3JpZ2luIjoiaHR0cHM6Ly9jb2xvcmdseXBoLXZpZXdlci5zZGYtZWNvc3lzdGVtLndvcmtlcnMuZGV2In0",
    //     "authenticatorData": "PCjrSS0GbGA5vsCv_4cuwExxiFtKmBEIJy3m_ql8spIdAAAAAA",
    //     "userHandle": "VTI5eWIySmhiaUJVWlhOMA"
    //   },

    const signatureRaw = base64url.toBuffer(credentialAuth.response.signature);
    const signature = convertEcdsaSignatureAsnToCompact(signatureRaw);
    const op = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(invocationArgs),
        auth: [new xdr.SorobanAuthorizationEntry({
            rootInvocation: invocation,
            credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
                new xdr.SorobanAddressCredentials({
                    address: Address.fromString(accountContractId).toScAddress(),
                    nonce,
                    signatureExpirationLedger,
                    signature: xdr.ScVal.scvMap([
                        new xdr.ScMapEntry({
                            key: xdr.ScVal.scvSymbol('authenticator_data'),
                            val: xdr.ScVal.scvBytes(base64url.toBuffer(credentialAuth.response.authenticatorData)),
                        }),
                        new xdr.ScMapEntry({
                            key: xdr.ScVal.scvSymbol('client_data_json'),
                            val: xdr.ScVal.scvBytes(base64url.toBuffer(credentialAuth.response.clientDataJSON)),
                        }),
                        new xdr.ScMapEntry({
                            key: xdr.ScVal.scvSymbol('signature'),
                            val: xdr.ScVal.scvBytes(signature),
                        }),
                    ])
                })
            ),
        })],
    });

    const transaction = new TransactionBuilder(
        new Account(key.publicKey(), accResp.sequence),
        { fee: '30889152', networkPassphrase: PUBLIC_networkPassphrase },
    )
        .addOperation(op)
        .setTimeout(30)
        .setSorobanData(new SorobanDataBuilder()
            .setFootprint(
                // Read
                [
                    // Contract instance for native asset contract being called.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.fromString(PUBLIC_nativeContractId).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyContractInstance(),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                    // Contract instance for account contract.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.fromString(accountContractId).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyContractInstance(),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                    // Contract code for account contracts.
                    xdr.LedgerKey.contractCode(
                        new xdr.LedgerKeyContractCode({ hash: Buffer.from(argWasmHash) })
                    ),
                ],
                // Write
                [
                    // Sender's balance.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.fromString(PUBLIC_nativeContractId).toScAddress(),
                            key: xdr.ScVal.scvVec([
                                nativeToScVal("Balance", { type: 'symbol' }),
                                xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress()),
                            ]),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                    // Receiver account.
                    xdr.LedgerKey.account(
                        new xdr.LedgerKeyAccount({
                            accountId: bundlerKey.xdrAccountId(),
                        })
                    ),
                    // Auth nonce for the sender (account contract).
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.fromString(accountContractId).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyNonce(
                                new xdr.ScNonceKey({ nonce })
                            ),
                            durability: xdr.ContractDataDurability.temporary()
                        })
                    ),
                ],
            )
            .setResources(
                285068193, // Instructions
                34408, // Read Bytes
                440, // Write Bytes
            )
            .setResourceFee(3907992)
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

function hexToUint8Array(hex: any) {
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
}