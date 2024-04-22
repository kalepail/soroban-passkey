<script lang="ts">
	import { WebAuthn } from '@darkedges/capacitor-native-webauthn';
	import base64url from 'base64url';
	import { Capacitor } from '@capacitor/core';

	let registerRes: any;
	let signRes: any;

	const onRegister = async () => {
		try {
			registerRes = await WebAuthn.startRegistration(
				{
					challenge: base64url('createchallenge'),
					rp: {
						id: Capacitor.isNativePlatform() ? 'passkey.sorobanbyexample.org' : undefined,
						name: 'Passkey Test'
					},
					user: {
						id: base64url('Soroban Test'),
						name: 'Soroban Test',
						displayName: 'Soroban Test'
					},
					pubKeyCredParams: [
						// { alg: -8, type: "public-key" }, // eddsa ed25519
						{ alg: -7, type: 'public-key' } // ecdsa secp256r1
					]
				}
				// {
				//   user: {
				//     id: "227cc20b-86bb-4719-80d8-22af0ae967dc",
				//     name: "JoyID 2023-07-25 15:47:08",
				//     displayName: "JoyID 2023-07-25 15:47:08",
				//   },
				//   authenticatorSelection: {
				//     userVerification: "required",
				//     authenticatorAttachment: "platform",
				//     requireResidentKey: true,
				//     residentKey: "preferred",
				//   },
				//   challenge: "mVi_4nnrnuRGG7OBcPpcnzi7Zh6E_C56aXm-EJl4v6k",
				//   rp: {
				//     id: "app.joyid.dev",
				//     name: "JoyID",
				//   },
				//   excludeCredentials: [],
				//   pubKeyCredParams: [
				//     {
				//       alg: -7,
				//       type: "public-key",
				//     },
				//     {
				//       alg: -257,
				//       type: "public-key",
				//     },
				//   ],
				// }
			);
			console.log(JSON.stringify(registerRes, null, 2));
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		}
	};

	const onSign = async () => {
		try {
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

			// const authentication = {
			//   "response": {
			//     "signature": "MEYCIQDvk21ZrkfTuG6YtNsYtIOoztvz5fmjoWIauaDkzLjLIwIhALSDV9Goi9pSNx1eMXXCldpdA1aT2oCbbr0FBDe5pmIn",
			//     "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiU0dWc2JHOGdWMjl5YkdRIiwib3JpZ2luIjoiaHR0cHM6Ly9jb2xvcmdseXBoLXZpZXdlci5zZGYtZWNvc3lzdGVtLndvcmtlcnMuZGV2In0",
			//     "authenticatorData": "PCjrSS0GbGA5vsCv_4cuwExxiFtKmBEIJy3m_ql8spIdAAAAAA",
			//     "userHandle": "VTI5eWIySmhiaUJVWlhOMA"
			//   },
			//   "type": "public-key",
			//   "rawId": "bxzER7O8tCzvipe6Et_obIjrLM4",
			//   "authenticatorAttachment": "platform",
			//   "id": "bxzER7O8tCzvipe6Et_obIjrLM4"
			// }

			signRes = await WebAuthn.startAuthentication(
				{
					challenge: base64url('Hello World'),
					// allowCredentials: [{ type: "public-key", id: registration.rawId, transports: ['internal'] }],
					rpId: Capacitor.isNativePlatform() ? 'passkey.sorobanbyexample.org' : undefined
				}
				// {
				//   challenge: "-4jq3HNSNHJG6KvWJQuSkksER_Xj2dtDu5pRG_utt6Y",
				//   allowCredentials: [],
				//   userVerification: "required",
				//   rpId: "app.joyid.dev",
				// }
			);
			console.log(JSON.stringify(signRes, null, 2));
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		}
	};
</script>

<div class="flex flex-col items-center justify-center min-h-dvh min-w-dvw w-dvw">
	<h1 class="text-3xl font-bold mb-2">Hello world!</h1>

	<button class="bg-slate-500 text-slate-300 px-2 py-1 mb-1 rounded" on:click={onRegister}
		>Register</button
	>
	{#if registerRes}
		<div class="max-w-full overflow-x-scroll">
			<pre><code class="text-xs">{JSON.stringify(registerRes, null, 2)}</code></pre>
		</div>
	{/if}

	<button class="bg-slate-500 text-slate-300 px-2 py-1 mb-1 rounded" on:click={onSign}>Sign</button>
	{#if signRes}
		<div class="max-w-full overflow-x-scroll">
			<pre><code class="text-xs">{JSON.stringify(signRes, null, 2)}</code></pre>
		</div>
	{/if}
</div>

<style lang="postcss">
	:global(html) {
		color: theme(colors.slate.500);
		background-color: theme(colors.slate.950);
	}
</style>
