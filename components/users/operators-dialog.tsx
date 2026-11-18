"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, Loader, Power, PowerOff, UserPlus } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  createOperator,
  fetchOperators,
  operatorsQueryKey,
  resetOperatorPin,
  updateOperator,
} from "@/lib/api/operators"
import type { AuthUser } from "@/lib/types"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20"

/**
 * Named operators for a shared account. Each person signs in with the shared
 * password plus their own username and PIN, so the audit log names them.
 */
export function OperatorsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AuthUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: operatorsQueryKey(user.user_id),
    queryFn: () => fetchOperators(user.user_id),
    enabled: open,
  })

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<{ name: string; pin: string } | null>(
    null
  )

  function refresh() {
    void queryClient.invalidateQueries({
      queryKey: operatorsQueryKey(user.user_id),
    })
  }

  const create = useMutation({
    mutationFn: () =>
      createOperator({
        user_id: user.user_id,
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        pin: pin.trim() || undefined,
      }),
    onSuccess: (created) => {
      setIssued({ name: created.full_name, pin: created.pin })
      setFullName("")
      setUsername("")
      setPin("")
      setError(null)
      refresh()
      toast.success(`${created.full_name} added.`)
    },
    onError: (err) =>
      setError(getApiErrorMessage(err, "We couldn't add this operator.")),
  })

  const reset = useMutation({
    mutationFn: (operatorId: string) => resetOperatorPin(operatorId),
    onSuccess: (result) => {
      setIssued({ name: result.full_name, pin: result.pin })
      refresh()
      toast.success(`New PIN for ${result.full_name}.`)
    },
    onError: (err) =>
      setError(getApiErrorMessage(err, "We couldn't reset that PIN.")),
  })

  const toggle = useMutation({
    mutationFn: ({
      operatorId,
      active,
    }: {
      operatorId: string
      active: boolean
    }) => updateOperator(operatorId, { active }),
    onSuccess: () => refresh(),
    onError: (err) =>
      setError(getApiErrorMessage(err, "We couldn't update that operator.")),
  })

  const busy = create.isPending || reset.isPending || toggle.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Operators for {user.full_name}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            People who sign in to {user.email}. Each has their own username and
            PIN so the audit log records who acted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3 rounded-lg border border-border p-4">
            <p className="font-heading text-sm font-semibold text-foreground">
              Add an operator
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="operator-full-name" className={labelClassName}>
                  Full name
                </Label>
                <Input
                  id="operator-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Mary Wanjiru"
                  className={inputClassName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="operator-username" className={labelClassName}>
                  Username
                </Label>
                <Input
                  id="operator-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="mary"
                  className={inputClassName}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="operator-pin" className={labelClassName}>
                PIN <span className="font-normal normal-case text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="operator-pin"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Leave blank to generate one"
                inputMode="numeric"
                className={inputClassName}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={busy || !fullName.trim() || !username.trim()}
              onClick={() => create.mutate()}
              className="h-11 w-fit rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90"
            >
              {create.isPending ? (
                <Loader className="animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus aria-hidden="true" />
              )}
              Add operator
            </Button>
          </div>

          {issued ? (
            <div className="grid gap-2 rounded-lg border border-brand-azure/30 bg-brand-azure/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                PIN for {issued.name}
              </p>
              <p className="font-mono text-2xl font-bold tracking-widest">
                {issued.pin}
              </p>
              <p className="text-xs text-muted-foreground">
                Shown once. Hand it over in person — they will be asked to
                choose their own PIN at sign-in.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-fit rounded-full px-4"
                onClick={() => {
                  void navigator.clipboard?.writeText(issued.pin)
                  toast.success("PIN copied.")
                }}
              >
                Copy PIN
              </Button>
            </div>
          ) : null}

          <div className="grid gap-2">
            <p className="font-heading text-sm font-semibold text-foreground">
              Operators
            </p>
            {query.isPending ? (
              <p className="py-4 text-sm text-muted-foreground">Loading…</p>
            ) : query.isError ? (
              <p className="py-4 text-sm text-destructive">
                We couldn&apos;t load the operators.
              </p>
            ) : (query.data ?? []).length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No operators yet. This account signs in with its password only.
              </p>
            ) : (
              <ul className="grid gap-2">
                {(query.data ?? []).map((operator) => (
                  <li
                    key={operator.operator_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {operator.full_name}{" "}
                        <span className="font-normal text-muted-foreground">
                          @{operator.username}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {operator.active ? "Active" : "Disabled"}
                        {operator.must_change_pin
                          ? " · must change PIN at next sign-in"
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => reset.mutate(operator.operator_id)}
                        className="rounded-full"
                      >
                        <KeyRound aria-hidden="true" />
                        Reset PIN
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          toggle.mutate({
                            operatorId: operator.operator_id,
                            active: !operator.active,
                          })
                        }
                        className="rounded-full"
                      >
                        {operator.active ? (
                          <PowerOff aria-hidden="true" />
                        ) : (
                          <Power aria-hidden="true" />
                        )}
                        {operator.active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
