import * as CBOR from 'cbor-x/decode'
import base64url from 'base64url';
import { bufToBigint, bigintToBuf } from 'bigint-conversion'
import { hash } from '@stellar/stellar-sdk';

// WebAuthn.startRegistration
// (web)
// {
//     "id": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "rawId": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "response": {
//       "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYK6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpVdAAAAAPv8MAcVTk7MjAtuAgVX170AFB-CLFYumAY5dTmA-w_IK6p3bQi3pQECAyYgASFYIGW9SIVw0IkjsGcpWa4Wx2VZdYvEkdjPS-bqxX85M29HIlggc0GQb1oRSzTfx46AM1DNKRJ_p6wKjZRR9g5bz8LsiM8",
//       "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmciLCJjcm9zc09yaWdpbiI6ZmFsc2V9",
//       "transports": [
//         "hybrid",
//         "internal"
//       ],
//       "publicKeyAlgorithm": -7,
//       "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEZb1IhXDQiSOwZylZrhbHZVl1i8SR2M9L5urFfzkzb0dzQZBvWhFLNN_HjoAzUM0pEn-nrAqNlFH2DlvPwuyIzw",
//       "authenticatorData": "K6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpVdAAAAAPv8MAcVTk7MjAtuAgVX170AFB-CLFYumAY5dTmA-w_IK6p3bQi3pQECAyYgASFYIGW9SIVw0IkjsGcpWa4Wx2VZdYvEkdjPS-bqxX85M29HIlggc0GQb1oRSzTfx46AM1DNKRJ_p6wKjZRR9g5bz8LsiM8"
//     },
//     "type": "public-key",
//     "clientExtensionResults": {},
//     "authenticatorAttachment": "platform"
//   }

// (ios)
// {
//     "id": "FNvVPJP3hmWrGfbGrfHjJYrK72s",
//     "type": "public-key",
//     "authenticatorAttachment": "platform",
//     "rawId": "FNvVPJP3hmWrGfbGrfHjJYrK72s",
//     "response": {
//         "transports": [
//             "internal"
//         ],
//         "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmcifQ",
//         "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYK6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpVdAAAAAPv8MAcVTk7MjAtuAgVX170AFBTb1TyT94Zlqxn2xq3x4yWKyu9rpQECAyYgASFYIMQDtLI1TS_oC8p8G1WJyVQhgk6HEEV6oh_fzzffMNrwIlggEcUe0F_AsXcYPK2VnbNqAGOtx6r00KfryoHTL7ZeF-E"
//     }
// }

// WebAuthn.startAuthentication 
// (web)
// {
//     "id": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "rawId": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "response": {
//       "authenticatorData": "K6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpUdAAAAAA",
//       "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmciLCJjcm9zc09yaWdpbiI6ZmFsc2V9",
//       "signature": "MEQCIHf6wXsVbm3Nv2AdmdUxHh-mfG60Y3Omu7-gfFBaV4G_AiB2BQPWiyuxEOJssAM0fP4MUwKA_q_1ybReU_mqWY2c9A",
//       "userHandle": "U29yb2JhbiBUZXN0"
//     },
//     "type": "public-key",
//     "clientExtensionResults": {},
//     "authenticatorAttachment": "platform"
//   }

// (ios)
// {
//     "authenticatorAttachment": "platform",
//     "rawId": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "type": "public-key",
//     "id": "H4IsVi6YBjl1OYD7D8grqndtCLc",
//     "response": {
//       "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL3Bhc3NrZXkuc29yb2JhbmJ5ZXhhbXBsZS5vcmcifQ",
//       "authenticatorData": "K6IVONck2rpXYfkLEGUqpBJhNdZXyHOXyWvGrTtRJpUdAAAAAA",
//       "userHandle": "VTI5eWIySmhiaUJVWlhOMA",
//       "signature": "MEUCIFlHfLFaHULwdwDXVS3rJcxKNIsxbN3D58Lxys9cDK2uAiEA6Un1AQ0HVPyAya_ZXYiVB9Bvv1JesAfgQLATtCPFEI0"
//     }
//   }

// await navigator.credentials.create({
//     publicKey: {
//         challenge: new Uint8Array([114,183,154,181,231,33,106,89,94,158,7]),
//         rp: {
//             name: "Soroban Test",
//         },
//         user: {
//             id: new Uint8Array([74,138,232,109,169,211,122,203]),
//             name: "Soroban Test",
//             displayName: "Soroban Test",
//         },
//         authenticatorSelection: {
//             requireResidentKey: false,
//             residentKey: "preferred",
//             userVerification: "preferred",
//         },
//         pubKeyCredParams: [{ alg: -7, type: "public-key" }],
//     }
// })

// await navigator.credentials.get({
//     publicKey: {
//         challenge: new Uint8Array([114,183,154,181,231,33,106,89,94,158,7]),
//     }
// })

export async function getPublicKeys(registration: any) {
    const contractSalt = hash(base64url.toBuffer(registration.id))

    console.log(JSON.stringify(registration, null, 2));

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