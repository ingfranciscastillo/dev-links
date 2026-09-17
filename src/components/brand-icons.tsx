import {
	SiBehance,
	SiBluesky,
	SiFigma,
	SiGithub,
	SiGoogle,
	SiInstagram,
	SiMastodon,
	SiThreads,
	SiX,
} from "@icons-pack/react-simple-icons";
import type { ReactElement } from "react";
import type { SocialPlatformKey } from "@/lib/social-links";

export function GithubIcon(props: { size?: number; className?: string }) {
	return (
		<SiGithub
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function XIcon(props: { size?: number; className?: string }) {
	return (
		<SiX
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function GoogleIcon(props: { size?: number; className?: string }) {
	return (
		<SiGoogle
			size={props.size ?? 16}
			color="#EA4335"
			className={props.className}
		/>
	);
}

export function InstagramIcon(props: { size?: number; className?: string }) {
	return (
		<SiInstagram
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function ThreadsIcon(props: { size?: number; className?: string }) {
	return (
		<SiThreads
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function BehanceIcon(props: { size?: number; className?: string }) {
	return (
		<SiBehance
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function FigmaIcon(props: { size?: number; className?: string }) {
	return (
		<SiFigma
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function MastodonIcon(props: { size?: number; className?: string }) {
	return (
		<SiMastodon
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export function BlueskyIcon(props: { size?: number; className?: string }) {
	return (
		<SiBluesky
			size={props.size ?? 16}
			color="currentColor"
			className={props.className}
		/>
	);
}

export const SOCIAL_PLATFORM_ICONS: Record<
	SocialPlatformKey,
	(props: { size?: number; className?: string }) => ReactElement
> = {
	x: XIcon,
	instagram: InstagramIcon,
	threads: ThreadsIcon,
	behance: BehanceIcon,
	figma: FigmaIcon,
	mastodon: MastodonIcon,
	bluesky: BlueskyIcon,
};
