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
				"mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent shadow-none",
				// InputGroup's own base sets the focus ring/border via
				// has-[[data-slot=input-group-control]:focus-visible]:*, not
				// :focus-within — a plain focus-within:ring-0 override doesn't
				// conflict with that (different selector), so the 3px ring stayed
				// visible around the whole box. Matching the exact same has-[...]
				// selector is what lets it actually override. Confirmed via
				// computed boxShadow before/after this fix.
				"has-[[data-slot=input-group-control]:focus-visible]:border-brand has-[[data-slot=input-group-control]:focus-visible]:ring-0",
				className,
			)}
		>
			<InputGroupInput
				{...props}
				type={visible ? "text" : "password"}
				className="min-w-0 flex-1 pl-0"
			/>

			{/* InputGroupAddon focuses the input on click by default, but skips
			that when the click lands on a button inside it — see input-group.tsx. */}
			<InputGroupAddon align="inline-end" className="ml-auto shrink-0 pr-0">
				<InputGroupButton
					type="button"
					size="icon-xs"
					variant="ghost"
					tabIndex={-1}
					onClick={() => setVisible((v) => !v)}
					aria-label={visible ? "Hide password" : "Show password"}
					// ghost's own hover:bg-accent/dark:hover:bg-accent draws a filled
					// square behind the icon — only the icon itself should light up.
					className="hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
				>
					{visible ? (
						<EyeClosedIcon className=" h-4 w-4" strokeWidth={1.5} />
					) : (
						<EyeIcon className="h-4 w-4" strokeWidth={1.5} />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

export { PasswordInput };
