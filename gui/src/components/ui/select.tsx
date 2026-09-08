/**
 * [INPUT]: Origin-attested shadcn form primitives, React props, Lucide icons, and control theme tokens
 * [OUTPUT]: SelectControl with aligned trigger content, portalled choices, keyboard navigation, and form semantics
 * [POS]: App-owned shadcn Select composition shared by filters and editors
 * [PROTOCOL]: Update this header when making changes, then check README.md.
 */
import { Check, ChevronDown } from "lucide-react";
import { Select } from "./forms";

type SelectOption = { value: string; label: string };
type SelectControlProps = {
  id?: string;
  name?: string;
  label: string;
  value: string | null;
  options: readonly SelectOption[];
  onValueChange(value: string): void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function SelectControl({
  id,
  name,
  label,
  value,
  options,
  onValueChange,
  placeholder,
  disabled,
  required,
  className = "",
}: SelectControlProps) {
  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      name={name}
      disabled={disabled}
      required={required}
    >
      <Select.Trigger
        id={id}
        aria-label={label}
        data-field={name}
        data-value={value ?? ""}
        data-slot="select-trigger"
        className={`flex min-h-[44px] w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--select-border)] bg-[var(--select-background)] px-3 py-2 text-left text-base font-normal leading-6 text-[var(--select-foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--select-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <Select.Value
          data-slot="select-value"
          placeholder={placeholder}
          className="block min-w-0 flex-1 truncate"
        />
        <Select.Icon className="flex size-[16px] shrink-0 items-center justify-center text-[var(--select-muted)]">
          <ChevronDown aria-hidden="true" className="block size-[16px]" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup
            data-slot="select-content"
            className="w-[var(--anchor-width)] min-w-36 max-w-[var(--available-width)] overflow-hidden rounded-lg border border-[var(--select-border)] bg-[var(--select-background)] text-[var(--select-foreground)] shadow-lg outline-none"
          >
            <Select.List className="max-h-[min(20rem,calc(var(--available-height)-0.5rem))] overflow-y-auto overscroll-contain p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  data-value={option.value}
                  data-slot="select-item"
                  className="flex min-h-[44px] cursor-default items-center gap-3 rounded-md px-3 py-2 text-base font-normal leading-6 outline-none select-none data-[highlighted]:bg-[var(--select-accent)]"
                >
                  <Select.ItemText className="min-w-0 flex-1 break-words">
                    {option.label}
                  </Select.ItemText>
                  <Select.ItemIndicator className="flex size-[16px] shrink-0 items-center justify-center">
                    <Check aria-hidden="true" className="block size-[16px]" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
