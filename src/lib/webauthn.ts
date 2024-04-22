import * as CBOR from 'cbor-x'
import base64url from 'base64url';
// import cosekey from 'parse-cosekey';

// const registration = {
//   "rawId": "bxzER7O8tCzvipe6Et_obIjrLM4",
//   "authenticatorAttachment": "platform",
//   "type": "public-key",
//   "id": "bxzER7O8tCzvipe6Et_obIjrLM4",
//   "response": {
//     "transports": [
//       "internal"
//     ],
//     "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxZMmhoYkd4bGJtZGwiLCJvcmlnaW4iOiJodHRwczovL2NvbG9yZ2x5cGgtdmlld2VyLnNkZi1lY29zeXN0ZW0ud29ya2Vycy5kZXYifQ",
//     "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYPCjrSS0GbGA5vsCv_4cuwExxiFtKmBEIJy3m_ql8spJdAAAAAPv8MAcVTk7MjAtuAgVX170AFG8cxEezvLQs74qXuhLf6GyI6yzOpQECAyYgASFYICdsHnB7TFsdbwC-Qj-Z86IGZ9gaGl7K-VF0FtWb6U52IlggI8gvI6Q__WMP8o1TswrABUPICuZ5uS1EtYR4zpRw1HA"
//   }
// }

export async function getPublicKey(registration: any) {
    // const decodedClientData = new TextDecoder('utf-8').decode(base64url.toBuffer(registration.response.clientDataJSON));
    // const clientDataObj = JSON.parse(decodedClientData);

    // console.log(clientDataObj);

    const decodedAttestationObj = CBOR.decode(base64url.toBuffer(registration.response.attestationObject));
    const { authData } = decodedAttestationObj;
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);

    idLenBytes.forEach((value: number, index: number) => dataView.setUint8(index, value));
    
    const credentialIdLength = dataView.getUint16(0);
    // const credentialId = authData.slice(55, credentialIdLength);
    const publicKeyBytes = authData.slice(55 + credentialIdLength);
    const publicKeyObject = new Map<string, any>(Object.entries(CBOR.decode(publicKeyBytes)));

    const publicKey = [
        4, // (0x04 prefix) https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm
        ...publicKeyObject.get('-2')!,
        ...publicKeyObject.get('-3')!
    ]

    return Buffer.from(publicKey)
}