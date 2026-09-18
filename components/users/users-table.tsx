"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { RoleBadge } from "@/components/role-badge"
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
import { UserActionsMenu } from "@/components/users/user-actions-menu"
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { fetchUsers, usersQueryKey } from "@/lib/api/users"
import { formatDate, getInitials, humanizeSlug } from "@/lib/format"
import { getRoleClasses } from "@/lib/roles"

const COLUMNS = 6

export function UsersTable() {
  const [search, setSearch] = useState("")

  const users = useQuery({ queryKey: usersQueryKey, queryFn: fetchUsers })
  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const roleLabels = useMemo(() => {
    const map = new Map<string, string>()
    roles.data?.forEach((role) => map.set(role.name, role.label))
    return map
  }, [roles.data])

  const visibleUsers = useMemo(() => {
    const list = users.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((user) =>
      [user.full_name, user.username, user.email].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [users.data, search])

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, username or email"
          label="Search users"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Name</TableHead>
            <TableHead className={tableHeadClassName}>Username</TableHead>
            <TableHead className={tableHeadClassName}>Email</TableHead>
            <TableHead className={tableHeadClassName}>Role</TableHead>
            <TableHead className={tableHeadClassName}>Date joined</TableHead>
            <TableHead className={cn(tableHeadClassName, "w-16 text-right")}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.isPending ? (
            <TableSkeletonRows columns={COLUMNS} />
          ) : users.isError ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message="We couldn't load users."
                onRetry={() => users.refetch()}
              />
            </TableMessageRow>
          ) : visibleUsers.length === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {search
                ? `No users match "${search.trim()}".`
                : "No staff accounts yet. Create the first one above."}
            </TableMessageRow>
          ) : (
            visibleUsers.map((user) => (
              <TableRow
                key={user.user_id}
                className={cn("h-14", !user.active && "text-muted-foreground")}
              >
                <TableCell className="px-4">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        user.active
                          ? getRoleClasses(user.role).avatar
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {getInitials(user.full_name)}
                    </span>
                    <span className="grid leading-tight">
                      <span className="font-semibold text-foreground">
                        {user.full_name}
                      </span>
                      {!user.active ? (
                        <span className="text-xs text-muted-foreground">
                          Disabled
                        </span>
                      ) : null}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="px-4">{user.username}</TableCell>
                <TableCell className="px-4">{user.email}</TableCell>
                <TableCell className="px-4">
                  <RoleBadge
                    role={user.role}
                    label={roleLabels.get(user.role) ?? humanizeSlug(user.role)}
                  />
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <UserActionsMenu user={user} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
