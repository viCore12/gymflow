"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Card, CardContent, CardHeader } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Label } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gymflow/ui";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@gymflow/ui";
import { stockMovesApi, productsApi, type StockMoveStatus, type StockMoveType } from "@/lib/api";

const MOVE_TYPE_LABEL: Record<string, string> = {
  in: "Nhập kho",
  out: "Xuất kho",
  adjustment: "Điều chỉnh",
};

const STATUS_BADGE: Record<string, { variant: "success" | "destructive" | "secondary"; label: string }> = {
  draft: { variant: "secondary", label: "Chờ duyệt" },
  approved: { variant: "success", label: "Đã duyệt" },
  rejected: { variant: "destructive", label: "Bị từ chối" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function StockMovesPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StockMoveStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<StockMoveType | "">("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stock-moves", { statusFilter, typeFilter }],
    queryFn: () => stockMovesApi.list({
      status: statusFilter || undefined,
    }),
  });

  const { data: allProducts } = useQuery({
    queryKey: ["products", { all: true }],
    queryFn: () => productsApi.list({ active_only: false }),
  });

  const createMutation = useMutation({
    mutationFn: (body: { product_id: string; move_type: StockMoveType; qty: number; note?: string }) =>
      stockMovesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-moves"] });
      setCreateOpen(false);
      setCreateForm({ product_id: "", move_type: "in", qty: "", note: "" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => stockMovesApi.approve(id, { approved_by_id: "current-user" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-moves"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => stockMovesApi.reject(id, { approved_by_id: "current-user" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-moves"] });
    },
  });

  const PRODUCT_MAP = allProducts?.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = `${p.sku} — ${p.name}`;
    return acc;
  }, {});

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    product_id: "",
    move_type: "in" as StockMoveType,
    qty: "",
    note: "",
  });

  const filteredMoves = data?.filter((m) => {
    if (typeFilter && m.move_type !== typeFilter) return false;
    return true;
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phiếu nhập/xuất</h1>
          <p className="text-gray-500 mt-1">Quản lý phiếu nhập/xuất kho</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Tạo phiếu</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo phiếu nhập/xuất mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="product_id">Sản phẩm</Label>
                <select
                  id="product_id"
                  value={createForm.product_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCreateForm((p) => ({ ...p, product_id: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Chọn sản phẩm</option>
                  {allProducts?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="move_type">Loại phiếu</Label>
                <select
                  id="move_type"
                  value={createForm.move_type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCreateForm((p) => ({ ...p, move_type: e.target.value as StockMoveType }))
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="in">Nhập kho</option>
                  <option value="out">Xuất kho</option>
                  <option value="adjustment">Điều chỉnh</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="qty">Số lượng</Label>
                <Input
                  id="qty"
                  type="number"
                  value={createForm.qty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((p) => ({ ...p, qty: e.target.value }))
                  }
                  placeholder="Số lượng"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Ghi chú</Label>
                <textarea
                  id="note"
                  value={createForm.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateForm((p) => ({ ...p, note: e.target.value }))
                  }
                  rows={2}
                  placeholder="Lý do nhập/xuất..."
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  if (!createForm.product_id || !createForm.qty) return;
                  createMutation.mutate({
                    product_id: createForm.product_id,
                    move_type: createForm.move_type,
                    qty: Number(createForm.qty),
                    note: createForm.note || undefined,
                  });
                }}
                disabled={createMutation.isPending || !createForm.product_id || !createForm.qty}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo phiếu"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Huỷ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as StockMoveStatus | "")
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Bị từ chối</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setTypeFilter(e.target.value as StockMoveType | "")
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tất cả loại</option>
              <option value="in">Nhập kho</option>
              <option value="out">Xuất kho</option>
              <option value="adjustment">Điều chỉnh</option>
            </select>
            {data && (
              <span className="text-sm text-gray-500 ml-auto">
                {filteredMoves.length} phiếu
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
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMoves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                      Chưa có phiếu nhập/xuất nào.
                    </TableCell>
                  </TableRow>
                )}
                {filteredMoves.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {PRODUCT_MAP?.[m.product_id] ?? m.product_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{MOVE_TYPE_LABEL[m.move_type]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {m.move_type === "in" ? "+" : m.move_type === "out" ? "-" : ""}{m.qty}
                    </TableCell>
                    <TableCell>
                      {STATUS_BADGE[m.status] && (
                        <Badge variant={STATUS_BADGE[m.status].variant}>
                          {STATUS_BADGE[m.status].label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(m.created_at)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                      {m.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      {m.status === "draft" && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(m.id)}
                            disabled={approveMutation.isPending}
                          >
                            Duyệt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectMutation.mutate(m.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Từ chối
                          </Button>
                        </div>
                      )}
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
