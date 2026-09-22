"use client"

import { useState, type Ref } from "react"
import { cn } from "cn"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Guest } from "@/lib/types"

interface GuestComboboxProps {
  id: string
  /** Selected guest id, or "" when none is chosen. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  guests: Guest[] | undefined
  loading: boolean
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

/** Secondary line under a guest's name: "jane@x.com · +254 …". */
function getContactLine(guest: Guest) {
  return [guest.email, guest.phone].filter(Boolean).join(" · ")
}

/**
 * Searchable guest picker (shadcn Popover + Command). The search matches
 * name, email or phone via cmdk `keywords`. Blacklisted guests stay visible
 * but can't be chosen. Picking the current guest again clears it.
 */
export function GuestCombobox({
  id,
  value,
  onChange,
  onBlur,
  ref,
  guests,
  loading,
  disabled,
  invalid,
  describedBy,
  className,
}: GuestComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = guests?.find((guest) => guest.guest_id === value)

  return (
    // `modal` keeps wheel scrolling inside the list working when the
    // combobox is rendered inside a Dialog.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled || loading || !guests}
          onBlur={onBlur}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected
              ? selected.full_name
              : loading
                ? "Loading guests…"
                : "Choose a guest"}
          </span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search by name, email or phone" />
          <CommandList>
            <CommandEmpty>No guest found.</CommandEmpty>
            <CommandGroup>
              {guests?.map((guest) => (
                <CommandItem
                  key={guest.guest_id}
                  value={guest.guest_id}
                  keywords={[
                    guest.full_name,
                    guest.email ?? "",
                    guest.phone ?? "",
                  ]}
                  disabled={guest.blacklisted}
                  data-checked={value === guest.guest_id}
                  onSelect={() => {
                    onChange(value === guest.guest_id ? "" : guest.guest_id)
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {guest.full_name}
                      {guest.blacklisted ? " (Blacklisted)" : ""}
                    </span>
                    {getContactLine(guest) ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {getContactLine(guest)}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
