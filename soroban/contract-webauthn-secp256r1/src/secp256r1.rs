use super::Error;
use p256::ecdsa::{signature::hazmat::PrehashVerifier as _, Signature, VerifyingKey};
use soroban_sdk::BytesN;

pub fn verify(key: &BytesN<65>, hash: &BytesN<32>, sig: &BytesN<64>) -> Result<(), Error> {
    let key = key.to_array();
    let hash = hash.to_array();
    let sig = sig.to_array();
    let vk = VerifyingKey::from_sec1_bytes(&key).map_err(|_| Error::Secp256r1PublicKeyParse)?;
    let s = Signature::from_slice(&sig).map_err(|_| Error::Secp256r1SignatureParse)?;
    vk.verify_prehash(&hash, &s)
        .map_err(|_| Error::Secp256r1VerifyFailed)
}
