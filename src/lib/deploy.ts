import { PUBLIC_accountSecp256r1ContractWasm, PUBLIC_factoryContractId, PUBLIC_factoryContractWasm, PUBLIC_horizonUrl, PUBLIC_networkPassphrase } from "$env/static/public";
import { Keypair, StrKey, xdr, hash, Address, Contract, Account, TransactionBuilder, SorobanDataBuilder } from "@stellar/stellar-sdk"

// TODO clean up this code

export async function handleDeploy(bundlerKey: Keypair, argPk: Buffer) {
    const argWasmHash = PUBLIC_accountSecp256r1ContractWasm;

    const salt = hash(argPk)
    const deployee = StrKey.encodeContract(hash(xdr.HashIdPreimage.envelopeTypeContractId(
        new xdr.HashIdPreimageContractId({
            networkId: hash(Buffer.from(PUBLIC_networkPassphrase, 'utf-8')),
            contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                new xdr.ContractIdPreimageFromAddress({
                    address: Address.fromString(PUBLIC_factoryContractId).toScAddress(),
                    salt,
                })
            )
        })
    ).toXDR()));

    const key = bundlerKey;
    const accResp = await (await fetch(`${PUBLIC_horizonUrl}/accounts/${key.publicKey()}`)).json();

    const contract = new Contract(PUBLIC_factoryContractId);

    const transaction = new TransactionBuilder(
        new Account(key.publicKey(), accResp.sequence),
        { fee: '21055000', networkPassphrase: PUBLIC_networkPassphrase },
    ).addOperation(contract.call(
        "deploy",
        xdr.ScVal.scvBytes(argPk),
        xdr.ScVal.scvBytes(Buffer.from(argWasmHash, 'hex')),
    )).setTimeout(30)
        .setSorobanData(new SorobanDataBuilder()
            .setFootprint(
                [
                    // Contract code for contract being called.
                    xdr.LedgerKey.contractCode(
                        new xdr.LedgerKeyContractCode({ hash: Buffer.from(PUBLIC_factoryContractWasm, 'hex') })
                    ),
                    // Contract instance for contract being called.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.contract(StrKey.decodeContract(PUBLIC_factoryContractId)).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyContractInstance(),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                    // Contract code for contract being deployed.
                    xdr.LedgerKey.contractCode(
                        new xdr.LedgerKeyContractCode({ hash: Buffer.from(argWasmHash, 'hex') })
                    ),
                ],
                [
                    // Contract instance for contract being deployed.
                    xdr.LedgerKey.contractData(
                        new xdr.LedgerKeyContractData({
                            contract: Address.contract(StrKey.decodeContract(deployee)).toScAddress(),
                            key: xdr.ScVal.scvLedgerKeyContractInstance(),
                            durability: xdr.ContractDataDurability.persistent()
                        })
                    ),
                ],
            )
            .setResources(
                16535694, // Instructions
                50472, // Read Bytes
                1060, // Write Bytes
            )
            .setResourceFee(500058)
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
        return deployee
    } else {
        console.error(txResp);
    }
}
