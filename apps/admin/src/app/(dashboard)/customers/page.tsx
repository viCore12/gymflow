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
import { customersApi } from "@/lib/api";

const GENDER_LABEL: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Number(searchParams.get("page") ?? "1");
  const q = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customers", { q, page }],
    queryFn: () => customersApi.list({ q: q || undefined, page, per_page: 20 }),
  });

  const pushParams = useCallback(
    (params: { q?: string; page?: number }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (params.q !== undefined) {
        if (params.q) sp.set("q", params.q);
        else sp.delete("q");
        sp.set("page", "1");
      }
      if (params.page !== undefined) sp.set("page", String(params.page));
      startTransition(() => router.push(`/customers?${sp}`));
    },
    [router, searchParams]
  );

  // Debounce search
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
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý danh sách khách hàng</p>
        </div>
        <Button onClick={() => router.push("/customers/new")}>+ Thêm KH</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
              className="max-w-sm"
            />
            {q && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  pushParams({ q: "" });
                }}
              >
                Xoá bộ lọc
              </Button>
            )}
            {data && (
              <span className="text-sm text-gray-500 ml-auto">
                {data.total} khách hàng
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
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                      {q ? "Không tìm thấy khách hàng phù hợp." : "Chưa có khách hàng nào."}
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.phone ?? "—"}</TableCell>
                    <TableCell>
                      {c.gender ? (
                        <Badge variant="secondary">{GENDER_LABEL[c.gender]}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          router.push(`/customers/${c.id}`);
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

      {/* Pagination */}
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
