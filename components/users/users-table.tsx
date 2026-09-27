"use client"

import { useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { Lock } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"
import { TablePagination } from "@/components/table-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  fetchUsers,
  usersListQueryKey,
  type UserListFilters,
} from "@/lib/api/users"
import { formatDate, getInitials, humanizeSlug } from "@/lib/format"
import { ROLE_NAMES, getRoleClasses, isRoleName } from "@/lib/roles"
import { usePagination } from "@/hooks/use-pagination"

const COLUMNS = 6
/** Select can't hold "" as an item value, so "every role" uses a sentinel. */
const ALL_ROLES = "all"

export function UsersTable() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<UserListFilters>({ role: "" })

  const users = useQuery({
    queryKey: usersListQueryKey(filters),
    queryFn: () => fetchUsers(filters),
    // Keep the old rows (dimmed) while another role loads.
    placeholderData: keepPreviousData,
  })
  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const roleLabels = useMemo(() => {
    const map = new Map<string, string>()
    roles.data?.forEach((role) => map.set(role.name, role.label))
    return map
  }, [roles.data])

  function getRoleLabel(role: string) {
    return roleLabels.get(role) ?? humanizeSlug(role)
  }

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

  const pagination = usePagination(visibleUsers)
  const { setPage } = pagination

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleRoleChange(value: string) {
    setFilters({ role: isRoleName(value) ? value : "" })
    setPage(1)
  }

  const emptyMessage = search.trim()
    ? `No users match "${search.trim()}"${
        filters.role ? ` in ${getRoleLabel(filters.role)}` : ""
      }.`
    : filters.role
      ? `No ${getRoleLabel(filters.role)} accounts yet.`
      : "No staff accounts yet. Create the first one above."

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-3xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search name, username or email"
          label="Search users"
        />
        <Select
          value={filters.role || ALL_ROLES}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger
            aria-label="Filter by role"
            className="h-11 w-full rounded-lg border-border bg-background px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 data-[size=default]:h-11 sm:w-52 md:text-base"
          >
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {ROLE_NAMES.map((role) => (
              <SelectItem key={role} value={role}>
                {getRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Name</TableHead>
            <TableHead className={tableHeadClassName}>Username</TableHead>
            <TableHead className={tableHeadClassName}>Email</TableHead>
            <TableHead className={tableHeadClassName}>Role</TableHead>
            <TableHead className={tableHeadClassName}>Date joined</TableHead>
            <TableHead className={cn(tableHeadClassName, "w-24 text-center")}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          aria-busy={users.isPlaceholderData}
          className={cn(
            "transition-opacity",
            users.isPlaceholderData && "opacity-60"
          )}
        >
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
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            pagination.pageItems.map((user) => (
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
                      {user.is_locked ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                          <Lock aria-hidden="true" className="size-3" />
                          Locked
                        </span>
                      ) : null}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="px-4">{user.username}</TableCell>
                <TableCell className="px-4">{user.email}</TableCell>
                <TableCell className="px-4">
                  <RoleBadge role={user.role} label={getRoleLabel(user.role)} />
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="px-4 text-center">
                  <UserActionsMenu user={user} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {users.isSuccess ? (
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={setPage}
          itemLabel="users"
        />
      ) : null}
    </div>
  )
}
