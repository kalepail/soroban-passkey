import * as CBOR from 'cbor-x/decode'
import base64url from 'base64url';
import { bufToBigint, bigintToBuf } from 'bigint-conversion'
import { hash } from '@stellar/stellar-sdk';

// WebAuthn.startRegistration
// {
//     "id": "BbWw-56U1Bdh4jpONtSKCEqpxSU",
//     "response": {
//         "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmcifQ",
//         "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYK6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpVdAAAAAPv8MAcVTk7MjAtuAgVX170AFAW1sPuelNQXYeI6TjbUighKqcUlpQECAyYgASFYIIEhi2HUX_7Nw4c_Wj3FOmEbTgZ9oljBn6VuvipL3Ph6IlggiyAMPKGboncLSp0VkpMiXzfDtJtGHDwrwyd5kCnxpNE",
//         "transports": [
//             "internal"
//         ]
//     },
//     "type": "public-key",
//     "authenticatorAttachment": "platform",
//     "rawId": "BbWw-56U1Bdh4jpONtSKCEqpxSU"
// }

// WebAuthn.startAuthentication
// {
//     "authenticatorAttachment": "platform",
//     "rawId": "BbWw-56U1Bdh4jpONtSKCEqpxSU",
//     "type": "public-key",
//     "response": {
//         "authenticatorData": "K6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpUdAAAAAA",
//         "signature": "MEUCIQDpmUyKV55Mf5lj68XAsYLJN9dBFf3dWk-BMeaHUwZIwwIgZsI7xoP0AFMOqrd7lGch05sgo8KlNRuKQ-0LR0IlP1M",
//         "userHandle": "VTI5eWIySmhiaUJVWlhOMA",
//         "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmcifQ"
//     },
//     "id": "BbWw-56U1Bdh4jpONtSKCEqpxSU"
// }

export async function getPublicKeys(registration: any) {
    const contractSalt = hash(base64url.toBuffer(registration.id))

    if (registration.response.attestationObject) {
        const decodedAttestationObj = CBOR.decode(base64url.toBuffer(registration.response.attestationObject));
        const { authData } = decodedAttestationObj;
        const dataView = new DataView(new ArrayBuffer(2));
        const idLenBytes = authData.slice(53, 55);

        idLenBytes.forEach((value: number, index: number) => dataView.setUint8(index, value));

        const credentialIdLength = dataView.getUint16(0);
        const publicKeyBytes = authData.slice(55 + credentialIdLength);
        const publicKeyObject = new Map<string, any>(Object.entries(CBOR.decode(publicKeyBytes)));

        const publicKey = Buffer.from([
            4, // (0x04 prefix) https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm
            ...publicKeyObject.get('-2')!,
            ...publicKeyObject.get('-3')!
        ])

        return {
            contractSalt,
            publicKey
        }
    }

    else {
        return {
            contractSalt
        }
    }
}

export function convertEcdsaSignatureAsnToCompact(sig: Buffer) {
    // Define the order of the curve secp256k1
    // https://github.com/RustCrypto/elliptic-curves/blob/master/p256/src/lib.rs#L72
    const q = Buffer.from('ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551', 'hex')

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

    let signature64

    // Force low S range
    // https://github.com/stellar/stellar-protocol/discussions/1435#discussioncomment-8809175
    // https://discord.com/channels/897514728459468821/1233048618571927693
    if (bufToBigint(s) > ((bufToBigint(q) - BigInt(1)) / BigInt(2))) {
        signature64 = Buffer.from([...r, ...Buffer.from(bigintToBuf(bufToBigint(q) - bufToBigint(s)))]);
    } else {
        signature64 = Buffer.from([...r, ...s]);
    }

    return signature64;
}