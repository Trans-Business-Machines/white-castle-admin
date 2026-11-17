"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { KeyRound, Plus } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"
import { CreateRoleDialog } from "@/components/users/create-role-dialog"
import { RolePermissionsDialog } from "@/components/users/role-permissions-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchInput } from "@/components/users/table-toolbar"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { formatDate } from "@/lib/format"
import { hasPermission } from "@/lib/roles"
import type { Role } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const COLUMNS = 5

export function RolesTable() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Role | null>(null)

  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const canManage = hasPermission(user?.permissions, "roles:manage")
  const canCreate = hasPermission(user?.permissions, "roles:create")

  const visibleRoles = useMemo(() => {
    const list = roles.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((role) =>
      [role.label, role.name, role.description ?? ""].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [roles.data, search])

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-2xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search role or description"
          label="Search roles"
        />
        {canCreate ? (
          <CreateRoleDialog>
            <Button variant="outline" className="ml-auto h-11 rounded-lg px-4">
              <Plus aria-hidden="true" />
              Create role
            </Button>
          </CreateRoleDialog>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Role</TableHead>
            <TableHead className={tableHeadClassName}>Description</TableHead>
            <TableHead className={tableHeadClassName}>Permissions</TableHead>
            <TableHead className={tableHeadClassName}>Created</TableHead>
            <TableHead className={tableHeadClassName}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : roles.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load roles."
                onRetry={() => roles.refetch()}
              />
            </TableMessageRow>
          ) : visibleRoles.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {search
                ? `No roles match "${search.trim()}".`
                : "No roles found."}
            </TableMessageRow>
          ) : (
            visibleRoles.map((role) => (
              <TableRow key={role.name} className="h-14">
                <TableCell className="px-4">
                  <span className="flex items-center gap-2">
                    <RoleBadge role={role.name} label={role.label} />
                    {role.is_system_default ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        built-in
                      </span>
                    ) : null}
                  </span>
                </TableCell>

                <TableCell className="max-w-md px-4 whitespace-normal text-muted-foreground">
                  {role.description || "—"}
                </TableCell>
                <TableCell className="px-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <KeyRound aria-hidden="true" className="size-3.5" />
                    {role.permission_count}
                  </span>
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(role.created_at)}
                </TableCell>
                <TableCell className="px-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={!canManage}
                    onClick={() => setEditing(role)}
                  >
                    Edit permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <RolePermissionsDialog
        role={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
    </div>
  )
}
