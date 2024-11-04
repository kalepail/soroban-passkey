import { PUBLIC_rpcUrl, PUBLIC_horizonUrl, PUBLIC_chickenVsEggContractId } from "$env/static/public";
import { xdr, Address, scValToNative, SorobanRpc, Horizon } from "@stellar/stellar-sdk/minimal";

const rpc = new SorobanRpc.Server(PUBLIC_rpcUrl);
const horizon = new Horizon.Server(PUBLIC_horizonUrl)

export async function getVotes(accountContractId: string, charities: [string, string, string, boolean, number][]) {
    let vote: string | null = null

    try {
        const key = xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress())
        const { val } = await rpc.getContractData(PUBLIC_chickenVsEggContractId, key)

        vote = scValToNative(val.contractData().val())
    } catch {}

    for (const charity of charities) {
        const balance = await horizon.loadAccount(charity[0]).then((res) => res.balances.find((balance) => balance.asset_type === 'native')?.balance)
        charity[4] = Number(balance) - 10_000 // TODO temp until we're using USDC
    }

    return {
        vote,
        charities
    }
}