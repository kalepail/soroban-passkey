<script lang="ts">
	import { WebAuthn } from '@darkedges/capacitor-native-webauthn';
	import base64url from 'base64url';
	import { Capacitor } from '@capacitor/core';
	import { PUBLIC_horizonUrl } from '$env/static/public';
	import { Horizon, Keypair } from '@stellar/stellar-sdk';
	import { onDestroy, onMount } from 'svelte';
	import { getPublicKey } from '$lib/webauthn';
	import { handleDeploy } from '$lib/deploy';
	import { handleFund } from '$lib/fund';
	import { handleRefundBuild } from '$lib/refund_build';
	import { handleRefundSend } from '$lib/refund_send';
	import { getBalance } from '$lib/get_balance';
	import { fade, blur, slide, crossfade, fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let deployee: any;
	let registerRes: any;
	let signRes: any;
	let bundlerKey: Keypair;
	let bundlerPubkey: string;
	let balance: number;
	let loadingRegister = false;
	let loadingSign = false;

	let step = 5;
	let interval: NodeJS.Timeout;
	let dots = '';
	let choice: string | null = 'chicken';

	onDestroy(() => {
		clearInterval(interval);
	});

	onMount(async () => {
		interval = setInterval(() => {
			if (deployee) clearInterval(interval);
			else if (dots.length === 3) dots = '';
			else dots += '.';
		}, 500);

		// setTimeout(() => {
		// 	step = 8;
		// }, 500);

		if (localStorage.hasOwnProperty('sp:bundler')) {
			bundlerKey = Keypair.fromSecret(localStorage.getItem('sp:bundler')!);
			bundlerPubkey = bundlerKey.publicKey();
		} else {
			bundlerKey = Keypair.random();
			bundlerPubkey = bundlerKey.publicKey();

			const horizon = new Horizon.Server(PUBLIC_horizonUrl, { allowHttp: true });
			await horizon.friendbot(bundlerPubkey).call();
			localStorage.setItem('sp:bundler', bundlerKey.secret());
		}

		if (localStorage.hasOwnProperty('sp:deployee')) {
			deployee = localStorage.getItem('sp:deployee');
			await onBalance();
		}
	});

	const onRegister = async () => {
		if (deployee) {
			step++;
			return;
		}

		try {
			loadingRegister = true;

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
			step++;

			localStorage.setItem('sp:deployee', deployee);

			console.log(deployee);

			await handleFund(bundlerKey, deployee);
			await onBalance();
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		} finally {
			loadingRegister = false;
		}
	};

	const onSign = async () => {
		// TODO this should be a transaction to a new chicken/egg contract

		try {
			loadingSign = true;

			let { lastLedger, nonce, authHash } = await handleRefundBuild(bundlerKey, deployee);

			signRes = await WebAuthn.startAuthentication({
				challenge: base64url(authHash),
				rpId: Capacitor.isNativePlatform() ? 'passkey.sorobanbyexample.org' : undefined
			});

			await handleRefundSend(bundlerKey, deployee, lastLedger, nonce, signRes);
			step++;
			await onBalance();
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		} finally {
			loadingSign = false;
		}
	};

	const onFund = async () => {
		await handleFund(bundlerKey, deployee);
		await onBalance();
	};

	const onBalance = async () => {
		balance = (await getBalance(bundlerKey, deployee))! / 10_000_000;
		console.log(balance);
	};

	function truncateAccount(account: string) {
		return `${account.slice(0, 5)}...${account.slice(-5)}`;
	}
</script>

<div
	class="flex flex-col items-center justify-center min-h-dvh py-safe px-2 select-none overflow-hidden"
>
	<div class="flex w-full items-center">
		<div class="rounded-full border-2 border-yellow-500 p-1 {deployee ? 'bg-yellow-500' : null}">
			<svg
				class="stroke-violet-800 {deployee ? null : 'invisible'}"
				viewBox="0 0 15 15"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"><path d="M4 7.5L7 10l4-5"></path></svg
			>
		</div>

		{#if deployee}
			<span class="font-mono text-sm ml-2">{truncateAccount(deployee)}</span>
		{:else}
			<span class="font-mono text-sm ml-2">{dots}</span>
		{/if}
	</div>

	<div class="w-full relative text-center text-3xl font-bold my-auto">
		{#if step === 1}
			<h1
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				Welcome to a passkey powered blockchain experience
			</h1>
		{/if}

		{#if step === 2}
			<div
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					Fully non-custodial
				</h1>
				<h1 class="" in:fade={{ delay: 500, duration: 250 }} out:fade={{ duration: 250 }}>
					But also
				</h1>
				<h1 class="" in:fade={{ delay: 1500, duration: 250 }} out:fade={{ duration: 250 }}>
					Entirely convenient
				</h1>
			</div>
		{/if}

		{#if step === 3}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<p in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }} class="text-xl">
					You’re just a single tap away from a fully featured future of financial freedom powered by
					your face or fingers.
				</p>
				<br />
				<h1 in:fade={{ delay: 1500, duration: 250 }} out:fade={{ duration: 250 }} class="">
					F passphrases
				</h1>
			</div>
		{/if}

		{#if step === 4}
			<h1
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				Are you ready?
			</h1>
		{/if}

		{#if step === 5}
			<div
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					Press the button
				</h1>

				<br />

				<button
					class="relative inline-flex items-center border-2 border-yellow-500 rounded-lg p-2 bg-yellow-500/10 ring-2 ring-yellow-500/50 ring-offset-4 ring-offset-violet-800 shadow-2xl shadow-yellow-500/50 active:shadow-yellow-500/30 active:top-[2px]"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}
					on:click={onRegister}
				>
					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="30"
						height="30"
						><path
							d="M4 6h1V5H4v1zm6 0h1V5h-1v1zm.1 2.7a3.25 3.25 0 01-5.2 0l-.8.6c1.7 2.267 5.1 2.267 6.8 0l-.8-.6zM1 5V2.5H0V5h1zm1.5-4H5V0H2.5v1zM1 2.5A1.5 1.5 0 012.5 1V0A2.5 2.5 0 000 2.5h1zM0 10v2.5h1V10H0zm2.5 5H5v-1H2.5v1zM0 12.5A2.5 2.5 0 002.5 15v-1A1.5 1.5 0 011 12.5H0zM10 1h2.5V0H10v1zm4 1.5V5h1V2.5h-1zM12.5 1A1.5 1.5 0 0114 2.5h1A2.5 2.5 0 0012.5 0v1zM10 15h2.5v-1H10v1zm5-2.5V10h-1v2.5h1zM12.5 15a2.5 2.5 0 002.5-2.5h-1a1.5 1.5 0 01-1.5 1.5v1z"
							fill="currentColor"
						></path></svg
					>
					<div
						class="flex items-center justify-center"
						transition:slide={{
							duration: 250,
							delay: 250,
							axis: 'x',
							easing: quintOut
						}}
					>
						{#if loadingRegister}
							<svg
								class="mx-4"
								transition:slide={{
									duration: 150,
									delay: 0,
									axis: 'x',
									easing: quintOut
								}}
								xmlns="http://www.w3.org/2000/svg"
								width="30"
								height="30"
								viewBox="0 0 24 24"
								><path
									class="fill-yellow-500"
									d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
									><animateTransform
										attributeName="transform"
										dur="0.75s"
										repeatCount="indefinite"
										type="rotate"
										values="0 12 12;360 12 12"
									/></path
								></svg
							>
						{:else}
							<span
								class="mx-4 font-mono uppercase text-lg"
								transition:slide={{
									duration: 150,
									delay: 0,
									axis: 'x',
									easing: quintOut
								}}>Register</span
							>
						{/if}
					</div>

					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="30"
						height="30"
						><path
							d="M12.587 3.513a6.03 6.03 0 01.818 3.745v.75c0 .788.205 1.563.595 2.247M4.483 6.508c0-.795.313-1.557.871-2.119a2.963 2.963 0 012.103-.877c.789 0 1.545.315 2.103.877.558.562.871 1.324.871 2.12v.748c0 1.621.522 3.198 1.487 4.495m-4.46-5.244v1.498A10.542 10.542 0 009.315 14M4.483 9.505A13.559 13.559 0 005.821 14m-3.643-1.498a16.63 16.63 0 01-.669-5.244V6.51a6.028 6.028 0 01.79-3.002 5.97 5.97 0 012.177-2.2 5.914 5.914 0 015.955-.004"
							stroke="currentColor"
							stroke-linecap="square"
							stroke-linejoin="round"
						></path></svg
					>
				</button>
			</div>
		{/if}

		{#if step === 6}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					And just like that you’re in!
				</h1>

				<br />

				<p class="text-xl" in:fade={{ delay: 500, duration: 250 }} out:fade={{ duration: 250 }}>
					A singular action granting you access to a global financial ecosystem of hundreds of
					currencies, financial instruments, and services now all just a glance or tap away.
				</p>
			</div>
		{/if}

		{#if step === 7}
			<h1
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				It took humans awhile to get here, but we did, <br /> you did. Incredible.
			</h1>
		{/if}

		{#if step === 8}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					This is your new passkey powered Stellar account.
				</h1>
				<br />
				<pre
					class="flex flex-col bg-yellow-500/10 p-2 select-text"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}>
					<code class="font-mono text-base">{deployee?.substring(0, 28)}<br />{deployee?.substring(28)}</code>
				</pre>
				<br />
				<p class="text-xl" in:fade={{ delay: 500, duration: 250 }} out:fade={{ duration: 250 }}>
					You can sign whatever you want with it. And only you can.
				</p>
			</div>
		{/if}

		{#if step === 9}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<p class="text-xl" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					Let’s demonstrate our cryptographic super powers by settling once and for all an age old
					question...
				</p>
				<br />
				<h1 class="" in:fade={{ delay: 1000, duration: 250 }} out:fade={{ duration: 250 }}>
					Which came first the chicken or the egg?
				</h1>
			</div>
		{/if}

		{#if step === 10}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					Make your choice
				</h1>
				<br />
				<p class="text-xl" in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
					Then cryptographically sign it with your passkey powered Stellar account to securely
					record your vote for eternal, immutable, assurance, alongside all other participants.
				</p>
				<br />
				<div
					class="grid grid-cols-2 grid-rows-1 gap-4"
					in:fade={{ delay: 500, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					<button
						class="border-2 border-yellow-500 rounded-full p-3 text-[3rem] {choice === 'chicken'
							? 'bg-yellow-500/10 ring-2 ring-yellow-500/50 ring-offset-4 ring-offset-violet-800'
							: null}"
						on:click={() => (choice === 'chicken' ? (choice = null) : (choice = 'chicken'))}
						>🐔</button
					>
					<button
						class="border-2 border-yellow-500 rounded-full p-3 text-[3rem] {choice === 'egg'
							? 'bg-yellow-500/10 ring-2 ring-yellow-500/50 ring-offset-4 ring-offset-violet-800'
							: null}"
						on:click={() => (choice === 'egg' ? (choice = null) : (choice = 'egg'))}>🥚</button
					>
				</div>
			</div>
		{/if}

		{#if step === 11}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					An eggcellent choice
				</h1>
				<br />
				<p class="text-xl" in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
					Now press one final time to cryptographically sign your precious opinion for all time for
					all people everywhere to settle this debate. No middle men, no trust, no 3rd party
					services. Just your biometrics put to work by the power of math to solve humanity's most
					difficult challenges.
				</p>
				<br />
				<button
					class="relative w-full flex items-center justify-between border-2 border-yellow-500 rounded-lg p-2 bg-yellow-500/10 ring-2 ring-yellow-500/50 ring-offset-4 ring-offset-violet-800 shadow-2xl shadow-yellow-500/50 active:shadow-yellow-500/30 active:top-[2px]"
					in:fade={{ delay: 500, duration: 250 }}
					out:fade={{ duration: 250 }}
					on:click={onSign}
				>
					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="30"
						height="30"
						><path
							d="M4 6h1V5H4v1zm6 0h1V5h-1v1zm.1 2.7a3.25 3.25 0 01-5.2 0l-.8.6c1.7 2.267 5.1 2.267 6.8 0l-.8-.6zM1 5V2.5H0V5h1zm1.5-4H5V0H2.5v1zM1 2.5A1.5 1.5 0 012.5 1V0A2.5 2.5 0 000 2.5h1zM0 10v2.5h1V10H0zm2.5 5H5v-1H2.5v1zM0 12.5A2.5 2.5 0 002.5 15v-1A1.5 1.5 0 011 12.5H0zM10 1h2.5V0H10v1zm4 1.5V5h1V2.5h-1zM12.5 1A1.5 1.5 0 0114 2.5h1A2.5 2.5 0 0012.5 0v1zM10 15h2.5v-1H10v1zm5-2.5V10h-1v2.5h1zM12.5 15a2.5 2.5 0 002.5-2.5h-1a1.5 1.5 0 01-1.5 1.5v1z"
							fill="currentColor"
						></path></svg
					>
					<div
						class="absolute w-full flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
					>
						{#if loadingSign}
							<svg
								transition:blur={{ amount: 10 }}
								xmlns="http://www.w3.org/2000/svg"
								width="30"
								height="30"
								viewBox="0 0 24 24"
								><path
									class="fill-yellow-500"
									d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
									><animateTransform
										attributeName="transform"
										dur="0.75s"
										repeatCount="indefinite"
										type="rotate"
										values="0 12 12;360 12 12"
									/></path
								></svg
							>
						{:else}
							<span
								class="absolute inset-0 flex items-center justify-center mx-4 font-mono uppercase text-lg"
								transition:blur={{ amount: 10 }}
								>Sign for <span class="text-3xl ml-2">{choice === 'chicken' ? '🐔' : '🥚'}</span
								></span
							>
						{/if}
					</div>

					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="30"
						height="30"
						><path
							d="M12.587 3.513a6.03 6.03 0 01.818 3.745v.75c0 .788.205 1.563.595 2.247M4.483 6.508c0-.795.313-1.557.871-2.119a2.963 2.963 0 012.103-.877c.789 0 1.545.315 2.103.877.558.562.871 1.324.871 2.12v.748c0 1.621.522 3.198 1.487 4.495m-4.46-5.244v1.498A10.542 10.542 0 009.315 14M4.483 9.505A13.559 13.559 0 005.821 14m-3.643-1.498a16.63 16.63 0 01-.669-5.244V6.51a6.028 6.028 0 01.79-3.002 5.97 5.97 0 012.177-2.2 5.914 5.914 0 015.955-.004"
							stroke="currentColor"
							stroke-linecap="square"
							stroke-linejoin="round"
						></path></svg
					>
				</button>
			</div>
		{/if}

		{#if step === 12}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					Incredible!
				</h1>
				<br />
				<!-- TODO: Show the chicken and egg results -->
				<div></div>
			</div>
		{/if}

		{#if step === 13}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					The future is secure.
				</h1>
				<h1 class="" in:fade={{ delay: 1000, duration: 250 }} out:fade={{ duration: 250 }}>
					But it is also simple.
				</h1>
				<h1 class="" in:fade={{ delay: 2000, duration: 250 }} out:fade={{ duration: 250 }}>
					Yay people and their brains.
				</h1>
				<h1 class="" in:fade={{ delay: 3500, duration: 250 }} out:fade={{ duration: 250 }}>
					Yay God in heaven,
				</h1>
				<h1 class="" in:fade={{ delay: 5000, duration: 250 }} out:fade={{ duration: 250 }}>
					who made us this way.
				</h1>
			</div>
		{/if}

		{#if step === 14}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3 text-left"
				transition:scale={{ duration: 500, delay: 0, opacity: 0, start: 1.5, easing: quintOut }}
			>
				<h1 class="" in:fade={{ delay: 0, duration: 250 }} out:fade={{ duration: 250 }}>
					SoroPass
				</h1>
				<br />
				<p class="text-xl" in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
					Learn more about the Stellar blockchain which powers this experience: <a
						class="underline"
						href="https://stellar.org/soroban">stellar.org/soroban</a
					>
				</p>
				<br />
				<p class="text-xl" in:fade={{ delay: 500, duration: 250 }} out:fade={{ duration: 250 }}>
					Read the code here: <a
						class="underline"
						href="https://github.com/kalepail/soroban-passkey"
						>github.com/kalepail/soroban-passkey</a
					>
				</p>
				<br />
				<p class="text-xl" in:fade={{ delay: 750, duration: 250 }} out:fade={{ duration: 250 }}>
					Join our Discord: <a class="underline" href="https://discord.com/invite/stellardev"
						>discord.com/stellardev</a
					>
				</p>
			</div>
		{/if}
	</div>

	<div class="grid grid-rows-1 grid-cols-2">
		<button class={step <= 1 ? 'invisible pointer-events-none' : null} on:click={() => step--}>
			<svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30"
				><path d="M1.5 7.5l4-4m-4 4l4 4m-4-4H14" stroke="currentColor"></path></svg
			>
		</button>

		<button
			class="bg-yellow-500 rounded-full p-2 {(step === 5 && !deployee) ||
			(step === 10 && !choice) ||
			step >= 14
				? 'invisible pointer-events-none'
				: null}"
			on:click={() => step++}
		>
			<svg
				class="stroke-violet-800"
				viewBox="0 0 15 15"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="30"
				height="30"><path d="M13.5 7.5l-4-4m4 4l-4 4m4-4H1"></path></svg
			>
		</button>
	</div>
</div>

<!-- <div class="flex flex-col items-center justify-start min-h-dvh min-w-dvw w-dvw p-safe">
	<h1 class="text-3xl font-bold mb-1">SoroPass</h1>

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
</div> -->

<style lang="postcss">
	:global(html) {
		color: theme(colors.yellow.500);
		background-color: theme(colors.violet.800);
	}
</style>
