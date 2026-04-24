"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@gymflow/ui";
import { Card, CardContent, CardHeader } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gymflow/ui";
import { staffApi, type StaffRole } from "@/lib/api";

const ROLE_LABEL: Record<StaffRole, string> = {
  staff: "Nhân viên",
  coach: "HLV",
  manager: "Quản lý",
};

const ROLE_FILTER_OPTIONS: { value: StaffRole | ""; label: string }[] = [
  { value: "", label: "Tất cả vị trí" },
  { value: "staff", label: "Nhân viên" },
  { value: "coach", label: "HLV" },
  { value: "manager", label: "Quản lý" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function StaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Number(searchParams.get("page") ?? "1");
  const q = searchParams.get("q") ?? "";
  const role = (searchParams.get("role") ?? "") as StaffRole | "";
  const activeFilter = searchParams.get("active") ?? "all";

  const [searchInput, setSearchInput] = useState(q);

  const isActiveParam =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff", { q, page, role, active: activeFilter }],
    queryFn: () =>
      staffApi.list({
        q: q || undefined,
        role: (role as StaffRole) || undefined,
        is_active: isActiveParam,
        page,
        per_page: 20,
      }),
  });

  const pushParams = useCallback(
    (params: { q?: string; page?: number; role?: string; active?: string }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (params.q !== undefined) {
        if (params.q) sp.set("q", params.q);
        else sp.delete("q");
        sp.set("page", "1");
      }
      if (params.page !== undefined) sp.set("page", String(params.page));
      if (params.role !== undefined) {
        if (params.role) sp.set("role", params.role);
        else sp.delete("role");
        sp.set("page", "1");
      }
      if (params.active !== undefined) {
        if (params.active && params.active !== "all") sp.set("active", params.active);
        else sp.delete("active");
        sp.set("page", "1");
      }
      startTransition(() => router.push(`/staff?${sp}`));
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      const timeout = setTimeout(() => pushParams({ q: value }), 350);
      return () => clearTimeout(timeout);
    },
    [pushParams]
  );

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhân viên & HLV</h1>
          <p className="text-gray-500 mt-1">Quản lý nhân sự và lịch ca làm việc</p>
        </div>
        <Button onClick={() => router.push("/staff/new")}>+ Thêm nhân viên</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Tìm theo tên..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
              className="max-w-xs"
            />

            <select
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => pushParams({ role: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => pushParams({ active: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Đã nghỉ</option>
            </select>

            {(q || role || activeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  pushParams({ q: "", role: "", active: "all" });
                }}
              >
                Xoá bộ lọc
              </Button>
            )}

            {data && (
              <span className="text-sm text-gray-500 ml-auto">
                {data.total} nhân viên
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isError && (
            <p className="p-6 text-sm text-red-600">
              Không thể tải dữ liệu. Vui lòng thử lại.
            </p>
          )}
          {isLoading && (
            <p className="p-6 text-sm text-gray-500">Đang tải...</p>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                      {q || role ? "Không tìm thấy nhân viên phù hợp." : "Chưa có nhân viên nào."}
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/staff/${s.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{s.employee_code}</TableCell>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABEL[s.role]}</Badge>
                    </TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.is_active ? "Đang làm" : "Đã nghỉ"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(s.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          router.push(`/staff/${s.id}`);
                        }}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => pushParams({ page: page - 1 })}
            >
              ← Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => pushParams({ page: page + 1 })}
            >
              Sau →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
