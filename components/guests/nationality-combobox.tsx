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
import { nationalities } from "@/lib/data"

interface NationalityComboboxProps {
  id: string
  /** Selected nationality, or "" when none is chosen. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}

/**
 * Searchable single-select over `nationalities` (shadcn Popover + Command).
 * Picking the current value again clears it.
 */
export function NationalityCombobox({
  id,
  value,
  onChange,
  onBlur,
  ref,
  disabled,
  invalid,
  describedBy,
  className,
}: NationalityComboboxProps) {
  const [open, setOpen] = useState(false)

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
          disabled={disabled}
          onBlur={onBlur}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{value || "Choose a nationality"}</span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search nationalities" />
          <CommandList>
            <CommandEmpty>No nationality found.</CommandEmpty>
            <CommandGroup>
              {nationalities.map((nationality) => (
                <CommandItem
                  key={nationality}
                  value={nationality}
                  data-checked={value === nationality}
                  onSelect={() => {
                    onChange(value === nationality ? "" : nationality)
                    setOpen(false)
                  }}
                >
                  {nationality}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
