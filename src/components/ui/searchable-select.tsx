import { AltArrowDownIcon, UnreadIcon } from "@solar-icons/react/linear";
import { useState } from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command.tsx";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover.tsx";
import { cn } from "#/lib/utils.ts";

export type SearchableSelectOption = { value: string; label: string };

// Select + buscador para listas largas (países, idiomas) donde escanear un
// dropdown gigante es peor que escribir 3 letras. Reusa Popover + Command en
// vez de un dropdown nativo — mismo trigger visual que Select para que no se
// note la diferencia hasta que el usuario abre el menú.
export function SearchableSelect({
	id,
	value,
	onValueChange,
	options,
	placeholder = "Select…",
	searchPlaceholder = "Search…",
	emptyText = "No results.",
	className,
}: {
	id?: string;
	value: string;
	onValueChange: (value: string) => void;
	options: SearchableSelectOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const selected = options.find((o) => o.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					id={id}
					className={cn(
						// border-b acá porque "border-b-*" (color) por sí solo no pone
						// ancho — sin esto, un caller que solo pase border-b-border se
						// queda con un borde invisible de 0px (así pasó con Location y
						// Primary language).
						"flex w-full items-center justify-between gap-2 border-b border-transparent text-sm outline-none transition-colors duration-150",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<span className="line-clamp-1">{selected?.label ?? placeholder}</span>
					<AltArrowDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50" />
				</button>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				className="w-(--radix-popover-trigger-width) p-0"
			>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.label}
									onSelect={() => {
										onValueChange(option.value);
										setOpen(false);
									}}
								>
									<span className="flex size-3.5 shrink-0 items-center justify-center">
										{option.value === value && (
											<UnreadIcon size={16} className="size-4" />
										)}
									</span>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
