"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { formatDate } from "@/lib/format"

const COLUMNS = 4

export function RolesTable() {
  const [search, setSearch] = useState("")

  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const visibleRoles = useMemo(() => {
    const list = roles.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((role) =>
      [role.label, role.name, role.description].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [roles.data, search])

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search role or description"
          label="Search roles"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Role</TableHead>
            <TableHead className={tableHeadClassName}>Description</TableHead>
            <TableHead className={tableHeadClassName}>Created</TableHead>
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
                : "No roles yet. Add the first one above."}
            </TableMessageRow>
          ) : (
            visibleRoles.map((role) => (
              <TableRow key={role.name} className="h-14">
                <TableCell className="px-4">
                  <RoleBadge role={role.name} label={role.label} />
                </TableCell>

                <TableCell className="max-w-md px-4 whitespace-normal text-muted-foreground">
                  {role.description}
                </TableCell>
                <TableCell className="px-4">
                  {formatDate(role.created_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
