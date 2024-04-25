NETWORK=futurenet
SOURCE=default

PUBLIC_nativeContractId="CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT"
PUBLIC_chickenVsEggContractId="CARLS7WNGA6IBQ44KCHTZDMNNV5JRSF4WWMMYPCSARCQX6YB3UW2Y5SM"
PUBLIC_factoryContractWasm="316864fced90d7d745bc7c15c8964e034fa13c9e4cc7fac8ca012fe955260dbd"
PUBLIC_factoryContractId="CD7CTGTTTJ56M6T7M6X5XCIYPKARPO4O3THDROUJVWUETKHGJKF5ZM62"
PUBLIC_accountSecp256r1ContractWasm="888fb9501de9fc21e19c838d7c70dfc754b7c6c9a7a387b263ed3c8a9cdb90b6"

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