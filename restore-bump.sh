NETWORK=futurenet
SOURCE=default

PUBLIC_chickenVsEggContractId="CADVRBYFMG6RIRFP6VOAATDCZERWPCNGFKQ7KYPD3D4FAI7VZ7WFNDSB"
PUBLIC_factoryContractId="CCZWIOWKT4WGJQHWZFF7ARCQJFVWRXPOKG4WGY6DOZ72OHZEMKXAEGRO"
PUBLIC_accountSecp256r1ContractWasm="23d8e1fbdb0bb903815feb7d07b675db98b5376feedab056aab61910d41e80c1"


soroban contract restore --id $PUBLIC_chickenVsEggContractId --network $NETWORK --source $SOURCE --durability persistent
soroban contract restore --id $PUBLIC_factoryContractId --network $NETWORK --source $SOURCE  --durability persistent
soroban contract restore --wasm-hash $PUBLIC_accountSecp256r1ContractWasm --network $NETWORK --source $SOURCE --durability persistent

soroban contract extend --id $PUBLIC_chickenVsEggContractId --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --id $PUBLIC_factoryContractId --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295
soroban contract extend --wasm-hash $PUBLIC_accountSecp256r1ContractWasm --network $NETWORK --source $SOURCE --durability persistent --ledgers-to-extend 4294967295