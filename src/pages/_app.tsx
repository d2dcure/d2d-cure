import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthStateListener from "@/components/AuthStateListener";
import { LoadingBar } from '@/components/LoadingBar';
import LoginSuccessNotification from "@/components/LoginSuccessNotification";
import LogoutSuccessNotification from "@/components/LogoutSuccessNotification";
import { UserProvider } from "@/components/UserProvider";

import "../app/globals.css"; 
import '@/styles/nprogress.css';


const FlowbiteInit = dynamic(
	() => import("@/components/FlowbiteInit"),
	{ ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
	const router = useRouter();

	// Get the dynamic-URL component(s), if any, from the URL.
	const { enzyme, id } = router.query;

	// Parse the URL to create a unique page title for the browser.
	let subPages = router.pathname.split('/');
	let pageName = '';
	for (let subpage of subPages) {
		if (pageName != '') {
			pageName += " | " + pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('_', ' ');
		}
	}
	if (!pageName) { pageName = " | Home"; }
	if (enzyme) { pageName = pageName.replace("[enzyme]", `${enzyme}`); }
	if (id) { pageName = pageName.replace("[id]", `${id}`); }

	return (
		<UserProvider>
		<Head>
			<title>D2D{pageName}</title>
			<link rel="icon" href="/favicon.ico" />
		</Head>
		<AuthStateListener />
		<LoginSuccessNotification />
		<LogoutSuccessNotification />
		<LoadingBar />
		<Component {...pageProps} />
		<FlowbiteInit />
		</UserProvider>
	);
}

export default MyApp;
