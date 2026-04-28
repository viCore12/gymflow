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
import { productsApi } from "@/lib/api";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const showInactive = searchParams.get("showInactive") === "true";
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { q, showInactive }],
    queryFn: () => productsApi.list({ q: q || undefined, active_only: !showInactive }),
  });

  const pushParams = useCallback(
    (params: { q?: string; showInactive?: boolean }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (params.q !== undefined) {
        if (params.q) sp.set("q", params.q);
        else sp.delete("q");
      }
      if (params.showInactive !== undefined) {
        if (params.showInactive) sp.set("showInactive", "true");
        else sp.delete("showInactive");
      }
      startTransition(() => router.push(`/products?${sp}`));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-gray-500 mt-1">Quản lý danh sách sản phẩm</p>
        </div>
        <Button onClick={() => router.push("/products/new")}>+ Thêm SP</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm theo tên hoặc mã SKU..."
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pushParams({ showInactive: !showInactive })}
            >
              {showInactive ? "Ẩn SP không hoạt động" : "Hiện tất cả"}
            </Button>
            {data && (
              <span className="text-sm text-gray-500 ml-auto">
                {data.length} sản phẩm
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Giá bán</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                      {q ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào."}
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/products/${p.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatCurrency(p.price)}</TableCell>
                    <TableCell>
                      {p.stock <= 0 ? (
                        <span className="text-red-600 font-semibold">{p.stock}</span>
                      ) : p.stock <= 5 ? (
                        <span className="text-amber-600 font-semibold">{p.stock}</span>
                      ) : (
                        p.stock
                      )}
                      {p.stock <= 5 && (
                        <Badge variant="destructive" className="ml-2">Hết hàng</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge variant="success">Đang bán</Badge>
                      ) : (
                        <Badge variant="secondary">Ngừng bán</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          router.push(`/products/${p.id}`);
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
    </div>
  );
}
