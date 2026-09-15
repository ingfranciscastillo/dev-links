import { EyeClosedIcon, EyeIcon } from "@solar-icons/react/linear";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({
	className,
	...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className="relative">
			<Input
				{...props}
				type={visible ? "text" : "password"}
				className={cn("pr-9", className)}
			/>

			<button
				type="button"
				tabIndex={-1}
				onClick={() => setVisible((v) => !v)}
				aria-label={visible ? "Hide password" : "Show password"}
				className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
			>
				{visible ? (
					<EyeClosedIcon className="h-4 w-4" strokeWidth={1.5} />
				) : (
					<EyeIcon className="h-4 w-4" strokeWidth={1.5} />
				)}
			</button>
		</div>
	);
}

export { PasswordInput };
