import { EyeClosedIcon, EyeIcon } from "@solar-icons/react/linear";
import * as React from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

// InputGroup (no manual absolute/inset-y-0 math) so the toggle button is
// vertically centered by flexbox, same pattern the username field in
// signup.tsx already uses for its "devlinks.com/" prefix addon.
function PasswordInput({
	className,
	...props
}: Omit<React.ComponentProps<typeof InputGroupInput>, "type">) {
	const [visible, setVisible] = React.useState(false);

	return (
		<InputGroup
			className={cn(
				"mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent shadow-none focus-within:border-brand focus-within:ring-0",
				className,
			)}
		>
			<InputGroupInput
				{...props}
				type={visible ? "text" : "password"}
				className="pl-0"
			/>

			{/* InputGroupAddon focuses the input on click by default, but skips
			that when the click lands on a button inside it — see input-group.tsx. */}
			<InputGroupAddon align="inline-end" className="pr-0">
				<InputGroupButton
					type="button"
					size="icon-xs"
					variant="ghost"
					tabIndex={-1}
					onClick={() => setVisible((v) => !v)}
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? (
						<EyeClosedIcon className="h-4 w-4" strokeWidth={1.5} />
					) : (
						<EyeIcon className="h-4 w-4" strokeWidth={1.5} />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

export { PasswordInput };
