import { PUBLIC_rpcUrl, PUBLIC_horizonUrl, PUBLIC_chickenVsEggContractId } from "$env/static/public";
import { xdr, Address, scValToNative, Horizon } from "@stellar/stellar-sdk/minimal";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";

const rpc = new Server(PUBLIC_rpcUrl);
const horizon = new Horizon.Server(PUBLIC_horizonUrl)

export async function getVotes(accountContractId: string, charities: [string, string, string, boolean, number][]) {
    let vote: string | null = null

    try {
        console.log(accountContractId);

        const key = xdr.ScVal.scvAddress(Address.fromString(accountContractId).toScAddress())
        const { val } = await rpc.getContractData(PUBLIC_chickenVsEggContractId, key)

        vote = Address.account(val.contractData().val().address().accountId().ed25519()).toString() 
        // Error: Unsupported address type
        // scValToNative(val.contractData().val())
    } catch(err) {
        console.log(err);
    }

    for (const charity of charities) {
        const balance = await horizon.loadAccount(charity[0]).then((res) => {
            const usdc = res.balances.find((res) => res.asset_type === 'credit_alphanum4' && res.asset_code === 'USDC')?.balance || null
            const native = res.balances.find((res) => res.asset_type === 'native')?.balance || null

            return usdc ? Number(usdc) : native ? Number(native) - 10_000 : 0
        })
        charity[4] = balance
    }

    return {
        vote,
        charities
    }
}