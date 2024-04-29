NETWORK=futurenet
SOURCE=default

PUBLIC_nativeContractId="CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT"
PUBLIC_chickenVsEggContractId="CADVRBYFMG6RIRFP6VOAATDCZERWPCNGFKQ7KYPD3D4FAI7VZ7WFNDSB"
PUBLIC_factoryContractWasm="5d6a22f5203e13e4d285ec55fa0acd7a2e05b673545c571cd28d9f60fd6e8b34"
PUBLIC_factoryContractId="CDWTF3KJLFBFQPBMN3KAOUBMIYZAFINMEFKGPQ3TO6HLGRYPYW3YNGOQ"
PUBLIC_accountSecp256r1ContractWasm="9c59506097f1444aca5d42d140f8656bc6fc1fbbbc18ac6bd38ee5294f0a538c"

soroban contract restore --id $PUBLIC_nativeContractId --network $NETWORK --source $SOURCE --durability persistent
soroban contract restore --id $PUBLIC_chickenVsEggContractId --network $NETWORK --source $SOURCE --durability persistent
soroban contract restore --wasm-hash $PUBLIC_factoryContractWasm --network $NETWORK --source $SOURCE --durability persistent
soroban contract restore --id $PUBLIC_factoryContractId --network $NETWORK --source $SOURCE  --durability persistent
soroban contract restore --wasm-hash $PUBLIC_accountSecp256r1ContractWasm --network $NETWORK --source $SOURCE --durability persistent

soroban contract extend --id $PUBLIC_nativeContractId --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --id $PUBLIC_chickenVsEggContractId --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --wasm-hash $PUBLIC_factoryContractWasm --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --id $PUBLIC_factoryContractId --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --wasm-hash $PUBLIC_accountSecp256r1ContractWasm --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295