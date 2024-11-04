<script lang="ts">
	import {
		PUBLIC_rpcUrl,
		PUBLIC_networkPassphrase,
		PUBLIC_factoryContractId,
		PUBLIC_apiUrl,
		PUBLIC_LAUNCHTUBE_URL,
		PUBLIC_LAUNCHTUBE_JWT,
	} from "$env/static/public";
	import { onDestroy, onMount } from "svelte";
	import { getVotes } from "$lib/get_votes";
	import { fade, blur, slide, scale } from "svelte/transition";
	import { swipe, press, tap } from "svelte-gestures";
	import { PasskeyServer, PasskeyKit, PasskeyClient } from "passkey-kit";
	import base64url from "base64url";
    import { page } from "$app/stores";

	// TODO some back stuff and resetting may not make sense given if you use the code you can't use it again

	const account = new PasskeyKit({
		rpcUrl: PUBLIC_rpcUrl,
		networkPassphrase: PUBLIC_networkPassphrase,
		factoryContractId: PUBLIC_factoryContractId,
	});

	const server = new PasskeyServer({
		launchtubeUrl: PUBLIC_LAUNCHTUBE_URL,
		launchtubeJwt: PUBLIC_LAUNCHTUBE_JWT,
	});

	let code = $page.url.searchParams.get('code');
	let charities: [string, string, string, boolean, number][] = [
		[
			"GBV5YQGDHRGHXSVKQN25ZMZY5PSAQYZIF6I4IH56M2HCORIUVWBHNTNA",
			"Center for Reproductive Rights",
			"The Center for Reproductive Rights uses the power of law to advance reproductive rights as fundamental human rights around the world.",
			false,
			0
		],
		[
			"GBKPRR5VV3MDIRD7XUB3QZIH2A3BHY7DWADBVZRJKAINAWARZ5YP5M2O",
			"Asia Pacific Refugee Rights Network",
			"APRRN aims to advance the rights of refugees and other people in need of protection in the Asia Pacific region.",
			false,
			0
		],
		[
			"GB7WAIND4YRXM23RKSVPFZ35DABAUAPZYLGSYQFEE7YB5AJC6RKS5JNB",
			"Lebanese Red Cross Response to War on Lebanon",
			"The LRC is on the frontlines of the response, responding to escalating attacks and emergencies. Our volunteers and staff are working tirelessly to provide urgent health and disaster response services across the country.",
			false,
			0
		],
		[
			"GCFLFEQDBIMCZZKCHDYKQO47EDE43EXOMAZ2VZIWEOKYYYOH4562CL3P",
			"Hoops Sagrado",
			"Hoops Sagrado is a Washington D.C.-based nonprofit that empowers youth through basketball, education, and community development in Washington D.C. and Guatemala.",
			false,
			0
		],
	];
	let vote: string | null = null;

	let deployee: any;
	let loadingRegister = false;
	let loadingSign = false;

	let step = 0;
	let dotinterval: NodeJS.Timeout;
	let voteinterval: NodeJS.Timeout;
	let dots = "";
	let choice: [string, string] | null;

	onDestroy(() => {
		clearInterval(dotinterval);
		clearInterval(voteinterval);
	});

	onMount(async () => {
		setTimeout(() => (step = 1), 500);

		dotinterval = setInterval(() => {
			if (deployee) clearInterval(dotinterval);
			else if (dots.length === 3) dots = "";
			else dots += ".";
		}, 500);

		voteinterval = setInterval(() => onVotes(), 12000);

		if (localStorage.hasOwnProperty("sp:deployee")) {
			deployee = localStorage.getItem("sp:deployee");

			account.wallet = new PasskeyClient({
				contractId: deployee,
				rpcUrl: PUBLIC_rpcUrl,
				networkPassphrase: PUBLIC_networkPassphrase,
			});

			await onVotes();
		}

		charities[Math.floor(Math.random() * charities.length)][3] = true;
	});

	const onRegister = async (type?: "signin") => {
		if (!type && deployee) {
			step++;
			return;
		}

		try {
			loadingRegister = true;

			const { keyId_base64, publicKey } = await account.createKey(
				"GiveCon",
				"GiveCon User",
			);

			localStorage.setItem("sp:id", keyId_base64);
			deployee = await fetch(
				`${PUBLIC_apiUrl}/deploy?id=${keyId_base64}&pk=${base64url(publicKey)}&code=${code}`,
			).then(async (res) => {
				if (res.ok) {
					return res.text();
				}
				throw await res.text();
			});

			account.wallet = new PasskeyClient({
				contractId: deployee,
				rpcUrl: PUBLIC_rpcUrl,
				networkPassphrase: PUBLIC_networkPassphrase,
			});

			console.log(deployee);
			localStorage.setItem("sp:deployee", deployee);
			step++;
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		} finally {
			loadingRegister = false;
		}
	};

	const onSign = async () => {
		try {
			loadingSign = true;

			const keyId = localStorage.getItem("sp:id")!;
			const xdr = await fetch(
				`${PUBLIC_apiUrl}/donate?wallet=${deployee}&id=${keyId}&charity=${choice![0]}`,
			).then(async (res) => {
				if (res.ok) {
					return res.text();
				}
				throw await res.text();
			});

			const at = await account.sign(xdr, { keyId });

			await server.send(at);
			await onVotes();
			step++;
		} catch (error) {
			console.error(error);
			alert(JSON.stringify(error));
		} finally {
			loadingSign = false;
		}
	};

	const onVotes = async () => {
		if (deployee) {
			await getVotes(deployee, charities).then((res) => {
				vote = res.vote;
				charities = res.charities

				if (vote) {
					choice = [vote, charities.find((c) => c[0] === vote)![1]];
				}
			});
		}
	};

	function truncateAccount(account: string) {
		return `${account.slice(0, 5)}...${account.slice(-5)}`;
	}

	function swipeHandler(event: CustomEvent) {
		if (event.detail.direction === "right") goLeft();
		else if (event.detail.direction === "left") goRight();
	}
	function tapHandler(event: CustomEvent) {
		if (
			!["div", "h1", "p"].includes(
				event.detail.target.tagName.toLowerCase(),
			) ||
			event.detail.target.classList.contains("border-b") ||
			event.detail.target.parentElement.classList.contains("border-b") ||
			event.detail.target.parentElement.parentElement.classList.contains(
				"border-b",
			) ||
			event.detail.target.parentElement.parentElement.parentElement.classList.contains(
				"border-b",
			)
		)
			return;
		else if (
			document.querySelector("#soropass")?.clientWidth! / 2 >
			event.detail.x
		)
			goLeft();
		else goRight();
	}

	function goLeft() {
		if (!(step <= 1)) step--;
	}
	function goRight() {
		if (
			!(
				step >= 10 ||
				(step === 4 && !deployee) ||
				(step === 7 && !choice && !vote) ||
				(step === 8 && !vote)
			)
		)
			step++;
	}

	function getWidth(balance: number) {
		return balance / (7_500 / 4) * 100
	}

	function toggleOpenCharity(index: number) {
		for (const i in charities) {
			if (Number(i) === index) charities[i][3] = !charities[i][3];
			else charities[i][3] = false;
		}
	}

	function share() {
		return `https://twitter.com/intent/tweet?text=${encodeURIComponent("Just completed the Stellar passkey activation at Devcon by donating 10 $USDC to charity! Go try the passkey craze for yourself.")}&url=${encodeURIComponent("https://passkey.sorobanbyexample.org/")}`;
	}

	function resetAll() {
		localStorage.removeItem("sp:id");
		localStorage.removeItem("sp:bundler");
		localStorage.removeItem("sp:deployee");
		window.location.reload();
	}
</script>

<div
	id="soropass"
	class="relative w-full flex flex-col items-center justify-center h-dvh px-2 select-none overflow-hidden bg-[url('/bg.png')] bg-[length:100%_100%] bg-[#000000] max-h-[800px] max-w-[500px] py-2 {loadingRegister ||
	loadingSign
		? 'pointer-events-none'
		: null}"
	use:swipe={{ timeframe: 300, minSwipeDistance: 100, touchAction: "pan-y" }}
	use:tap={{ timeframe: 300 }}
	on:swipe={swipeHandler}
	on:tap={tapHandler}
>
	{#if step > 0}
		<div
			class="flex w-full items-center justify-between"
			use:press={{ timeframe: 1000, triggerBeforeFinished: true }}
			on:press={resetAll}
		>
			<div
				class="flex items-center origin-left"
				transition:scale={{
					duration: 500,
					delay: 250,
					opacity: 0,
					start: 0.8,
				}}
			>
				<svg
					class="stroke-black rounded-full border-2 border-white {deployee
						? 'bg-white'
						: null}"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="25"
					height="25"><path d="M4 7.5L7 10l4-5"></path></svg
				>

				{#if deployee}
					<span class="font-mono text-sm ml-2"
						>{truncateAccount(deployee)}</span
					>
				{:else}
					<span class="font-mono text-sm ml-2">{dots}</span>
				{/if}
			</div>

			<button
				class="flex items-center font-mono text-xs uppercase origin-right py-2 pl-2 {deployee
					? null
					: 'invisible'}"
				transition:scale={{
					duration: 500,
					delay: 250,
					opacity: 0,
					start: 0.8,
				}}
				on:click={resetAll}
			>
				Restart
				<svg
					class="stroke-white ml-2"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="15"
					height="15"
					><path
						d="M7.5 14.5A7 7 0 013.17 2M7.5.5A7 7 0 0111.83 13m-.33-3v3.5H15M0 1.5h3.5V5"
					></path></svg
				>
			</button>
		</div>
	{/if}

	<div
		class="w-full relative text-center text-[60px] uppercase leading-none my-auto"
	>
		{#if step === 1}
			<div
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class="mb-8"
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Welcome to <br /> Stellar Smart <br /> Wallets
				</h1>

				<p
					class="font-[Inter] font-light text-base normal-case"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					A passkey powered blockchain experience
				</p>
			</div>
		{/if}

		{#if step === 2}
			<div
				class="absolute w-full top-0 -translate-y-1/2"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class=""
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Fully <br /> non-custodial
				</h1>
				<br />
				<h1
					class=""
					in:fade={{ delay: 500, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					But also <br /> entirely <br /> convenient
				</h1>
			</div>
		{/if}

		{#if step === 3}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<p
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
					class="font-[Inter] font-light text-base normal-case"
				>
					You’re just a single tap away from a future of financial
					freedom powered by your face or fingerprints.
				</p>
				<br />
				<h1
					in:fade={{ delay: 500, duration: 250 }}
					out:fade={{ duration: 250 }}
					class=""
				>
					Say farewell to <br /> pass phrases
				</h1>
			</div>
		{/if}

		{#if step === 4}
			<div
				class="absolute flex flex-col items-center justify-center w-full top-0 -translate-y-1/2"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class="mb-8"
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Press <br /> the button
				</h1>

				<br />

				<button
					class="relative inline-flex items-center rounded-xl p-2 bg-[#ffda00] text-black active:top-[2px] disabled:bg-[#FFF6BF]"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}
					on:click={() => onRegister()}
					disabled={!code}
				>
					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="30"
						height="30"
						><path
							d="M4 6h1V5H4v1zm6 0h1V5h-1v1zm.1 2.7a3.25 3.25 0 01-5.2 0l-.8.6c1.7 2.267 5.1 2.267 6.8 0l-.8-.6zM1 5V2.5H0V5h1zm1.5-4H5V0H2.5v1zM1 2.5A1.5 1.5 0 012.5 1V0A2.5 2.5 0 000 2.5h1zM0 10v2.5h1V10H0zm2.5 5H5v-1H2.5v1zM0 12.5A2.5 2.5 0 002.5 15v-1A1.5 1.5 0 011 12.5H0zM10 1h2.5V0H10v1zm4 1.5V5h1V2.5h-1zM12.5 1A1.5 1.5 0 0114 2.5h1A2.5 2.5 0 0012.5 0v1zM10 15h2.5v-1H10v1zm5-2.5V10h-1v2.5h1zM12.5 15a2.5 2.5 0 002.5-2.5h-1a1.5 1.5 0 01-1.5 1.5v1z"
							fill="black"
						></path></svg
					>
					<div
						class="flex items-center justify-center"
						transition:slide={{
							duration: 250,
							delay: 250,
							axis: "x",
						}}
					>
						{#if loadingRegister}
							<svg
								class="mx-8"
								transition:slide={{
									duration: 150,
									delay: 0,
									axis: "x",
								}}
								xmlns="http://www.w3.org/2000/svg"
								width="30"
								height="30"
								viewBox="0 0 24 24"
								><path
									class="fill-black"
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
								class="mx-8 font-mono uppercase text-lg"
								transition:slide={{
									duration: 150,
									delay: 0,
									axis: "x",
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
							stroke="black"
							stroke-linecap="square"
							stroke-linejoin="round"
						></path></svg
					>
				</button>
			</div>
		{/if}

		{#if step === 5}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class="mb-8"
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					You’re in!
				</h1>

				<p
					class="font-[Inter] font-light text-base normal-case"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Access to the global financial ecosystem is now just a tap
					away. Now get ready to use your powers for good!
				</p>
			</div>
		{/if}

		{#if step === 6}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class=""
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					This is your new <br /> passkey powered <br /> blockchain account
				</h1>
				<br />
				<pre
					class="relative flex items-center justify-center p-4 select-text bg-[#262626] text-[#ffda00] rounded mb-6 border-b-2 border-[#ffda00]"
					in:fade={{ delay: 150, duration: 250 }}
					out:fade={{ duration: 250 }}>
					<code class="font-mono text-sm"
						>{deployee?.substring(0, 28)}<br />{deployee?.substring(
							28,
						)}</code
					>
				</pre>
				<p
					class="font-[Inter] font-medium text-lg normal-case"
					in:fade={{ delay: 300, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					You (and only you) can use this wallet to make a donation to
					a charity of your choice. We've loaded you up with $10 USDC.
					Where you send it? That's up to you.
				</p>
			</div>
		{/if}

		{#if step === 7}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class="mb-8"
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Select a charity to donate to
				</h1>

				<div
					class="text-left border-b"
					in:fade={{ delay: 250, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					<!-- TODO add animation -->
					{#each charities as [address, title, desc, selected], i}
						<div class="border-t">
							<p
								class="flex justify-between items-center font-[Inter] font-bold text-base normal-case py-5"
								on:click={() => toggleOpenCharity(i)}
							>
								{title}

								<span class="text-3xl font-extralight"
									>{selected ? "-" : "+"}</span
								>
							</p>

							<div
								class="pb-5"
								style="display: {selected ? 'block' : 'none'};"
							>
								<p
									class="font-[Inter] font-light text-base normal-case"
								>
									{desc}
								</p>
								<button
									class="relative inline-flex items-center justify-center rounded-full active:top-[2px] mx-auto"
									on:click={() => {
										choice = [address, title];
										step++;
									}}
								>
									<span
										class="font-[Inter] normal-case text-sm pr-4"
										>Donate Here</span
									>
									<svg
										class="stroke-black bg-[#ffda00] rounded-full p-2"
										viewBox="0 0 15 15"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										width="35"
										height="35"
										><path d="M13.5 7.5l-4-4m4 4l-4 4m4-4H1"
										></path></svg
									>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if step === 8}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class="mb-8"
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Stellar choice!
				</h1>
				<p
					class="font-[Inter] font-bold text-xl text-[#ffda00] normal-case mb-5"
					in:fade={{ delay: 100, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					{choice?.[1]}
				</p>
				<p
					class="font-[Inter] font-light text-base normal-case"
					in:fade={{ delay: 300, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Press one more time to secure your donation. All it takes is
					your fingerprint, and you've made the world a little
					brighter. 🌞 ️😎
				</p>
				<br />
				<button
					class="relative w-full flex items-center justify-between rounded-xl p-2 bg-[#ffda00] text-black active:top-[2px]"
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
							fill="black"
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
									class="fill-black"
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
								transition:blur={{ amount: 10 }}>Sign It</span
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
							stroke="black"
							stroke-linecap="square"
							stroke-linejoin="round"
						></path></svg
					>
				</button>
			</div>
		{/if}

		{#if step === 9}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class=""
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					How easy <br /> was that!?
				</h1>

				<p
					class="font-[Inter] font-light text-xl normal-case my-10"
					in:fade={{ delay: 100, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Check out how you’ve made a difference:
				</p>

				<div class="text-left">
					{#each charities as [address, title, desc, selected, balance], i}
						<div class="font-[Inter] font-normal text-base normal-case mb-5">
							<p>{title}</p>
							<div class="border {choice && address === choice[0] ? 'border-[#FFDA00]' : 'border-[#FFF6BF]'} rounded-full h-7 w-full my-1 relative overflow-hidden">
								<div class="{choice && address === choice[0] ? 'bg-[#FFDA00]' : 'bg-[#FFF6BF]'} absolute top-0 left-0 bottom-0 max-w-full" style="width: {getWidth(balance)}%;"></div>
							</div>
							<aside class="text-sm">${(balance).toLocaleString()}</aside>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if step === 10}
			<div
				class="absolute w-full top-0 -translate-y-1/2 px-3"
				transition:scale={{
					duration: 500,
					delay: 0,
					opacity: 0,
					start: 1.5,
				}}
			>
				<h1
					class=""
					in:fade={{ delay: 0, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					You did it!
				</h1>
				<br />
				<p
					class="font-[Inter] font-light text-base normal-case"
					in:fade={{ delay: 100, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Learn more about the Stellar blockchain which powers this
					experience: <br />
					<a class="underline" href="https://stellar.org/soroban"
						>stellar.org/soroban</a
					>
				</p>
				<br />
				<p
					class="font-[Inter] font-light text-base normal-case"
					in:fade={{ delay: 300, duration: 250 }}
					out:fade={{ duration: 250 }}
				>
					Join our Discord: <br />
					<a
						class="underline"
						href="https://discord.com/invite/stellardev"
						>discord.com/stellardev</a
					>
				</p>
				<br />
				<a
					class="relative inline-flex items-center justify-center rounded-full p-1 bg-[#ffda00] text-black active:top-[2px] mx-auto"
					in:fade={{ delay: 400, duration: 250 }}
					out:fade={{ duration: 250 }}
					href={share()}
					target="_blank"
					rel="noopener noreferrer"
				>
					<span class="font-mono uppercase text-base px-4"
						>Post in on X</span
					>
					<svg
						class="stroke-white bg-black rounded-full p-2"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="45"
						height="45"
						><path d="M13.5 7.5l-4-4m4 4l-4 4m4-4H1"></path></svg
					>
				</a>
			</div>
		{/if}
	</div>

	{#if step > 0}
		<div
			class="w-full flex items-center justify-center origin-bottom"
			transition:scale={{
				duration: 500,
				delay: 250,
				opacity: 0,
				start: 0.8,
			}}
		>
			<button
				class="w-full flex items-center justify-end relative {step <= 1
					? 'invisible pointer-events-none'
					: null} active:right-[2px]"
				on:click={() => step--}
			>
				<svg
					class="p-2"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="45"
					height="45"
					><path
						d="M1.5 7.5l4-4m-4 4l4 4m-4-4H14"
						stroke="currentColor"
					></path></svg
				>
			</button>
			<span class="shrink-0 mx-3 tabular-nums font-mono text-xs"
				>{step} of 10</span
			>
			{#if step >= 10}
				<button
					class="w-full flex items-center justify-start relative active:top-[2px]"
					on:click={resetAll}
				>
					<svg
						class="stroke-black bg-[#ffda00] rounded-full p-2"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="45"
						height="45"
						><path
							d="M7.5 14.5A7 7 0 013.17 2M7.5.5A7 7 0 0111.83 13m-.33-3v3.5H15M0 1.5h3.5V5"
						></path></svg
					>
				</button>
			{:else}
				<button
					class="w-full flex items-center justify-start relative {(step ===
						4 &&
						!deployee) ||
					(step === 7 && !choice && !vote) ||
					(step === 8 && !vote)
						? 'invisible pointer-events-none'
						: null} active:left-[2px]"
					on:click={() => step++}
				>
					<svg
						class="stroke-black bg-[#ffda00] rounded-full p-2"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						width="45"
						height="45"
						><path d="M13.5 7.5l-4-4m4 4l-4 4m4-4H1"></path></svg
					>
				</button>
			{/if}
		</div>
	{/if}
</div>
