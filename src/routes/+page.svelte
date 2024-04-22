<script lang="ts">
	import { WebAuthn } from '@darkedges/capacitor-native-webauthn';
	import base64url from 'base64url';
	import { Capacitor } from '@capacitor/core';
	import { PUBLIC_horizonUrl } from '$env/static/public';
	import { Horizon, Keypair } from '@stellar/stellar-sdk';
	import { onMount } from 'svelte';
	import { getPublicKey } from '$lib/webauthn';
	import { handleDeploy } from '$lib/deploy';
	import { handleFund } from '$lib/fund';
	import { handleRefundBuild } from '$lib/refund_build';
	import { handleRefundSend } from '$lib/refund_send';
	import { getBalance } from '$lib/get_balance';

	let deployee: any;
	let registerRes: any;
	let signRes: any;
	let bundlerKey: Keypair;
	let bundlerPubkey: string;
	let balance: number;

	onMount(async () => {
		if (localStorage.hasOwnProperty("sp:bundler")) {
			bundlerKey = Keypair.fromSecret(localStorage.getItem('sp:bundler')!)
			bundlerPubkey = bundlerKey.publicKey();
		} else {
			bundlerKey = Keypair.random()
			bundlerPubkey = bundlerKey.publicKey();

			const horizon = new Horizon.Server(PUBLIC_horizonUrl, { allowHttp: true });
			await horizon.friendbot(bundlerPubkey).call();
			localStorage.setItem('sp:bundler', bundlerKey.secret());
		}

		if (localStorage.hasOwnProperty("sp:deployee")) {
			deployee = localStorage.getItem('sp:deployee');
			await onBalance()
		}
	}) 

	const onRegister = async () => {
		try {
			registerRes = await WebAuthn.startRegistration({
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
				pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
			});

			const argPk = await getPublicKey(registerRes);

			deployee = await handleDeploy(bundlerKey, argPk);

			localStorage.setItem('sp:deployee', deployee);

			console.log(deployee);

			await handleFund(bundlerKey, deployee);
			await onBalance()
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		}
	};
	
	const onFund = async () => {
		await handleFund(bundlerKey, deployee);
		await onBalance()
	}

	const onRefund = async () => {
		try {
			let { lastLedger, nonce, authHash } = await handleRefundBuild(bundlerKey, deployee);

			signRes = await WebAuthn.startAuthentication({
				challenge: base64url(authHash),
				rpId: Capacitor.isNativePlatform() ? 'passkey.sorobanbyexample.org' : undefined
			});

			await handleRefundSend(bundlerKey, deployee, lastLedger, nonce, signRes);
			await onBalance()
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		}
	};

	const onBalance = async () => {
		balance = (await getBalance(bundlerKey, deployee))! / 10_000_000
		console.log(balance);
	}

	function truncateAccount(account: string) {
		return `${account.slice(0, 5)}...${account.slice(-5)}`;
	}
</script>

<div class="flex flex-col items-center justify-center min-h-dvh min-w-dvw w-dvw">
	<h1 class="text-3xl font-bold mb-2">SoroPass</h1>

	{#if bundlerPubkey}
		<h2 class="mb-1">Bundler: {truncateAccount(bundlerPubkey)}</h2>
	{/if}

	{#if deployee}
		<p class="mb-1">Account: {truncateAccount(deployee)}</p>
	{:else}
		<button class="bg-slate-500 text-slate-200 px-2 py-1 mb-1 rounded" on:click={onRegister}
			>Register</button
		>
	{/if}

	<button class="bg-slate-500 text-slate-200 px-2 py-1 mb-1 rounded" on:click={onFund}>Fund</button>

	<button class="bg-slate-500 text-slate-200 px-2 py-1 mb-1 rounded" on:click={onRefund}>Refund</button>

	<button class="bg-slate-500 text-slate-200 px-2 py-1 mb-1 rounded" on:click={onBalance}>Balance</button>
	
	{#if balance}
		<p class="mb-1">Balance: {balance} XLM</p>
	{/if}
</div>

<style lang="postcss">
	:global(html) {
		color: theme(colors.slate.300);
		background-color: theme(colors.slate.900);
	}
</style>
