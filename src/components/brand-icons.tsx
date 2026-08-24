import { SiGithub, SiGoogle, SiX } from "@icons-pack/react-simple-icons";

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
