"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Card, CardContent } from "@gymflow/ui";
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
import { stockTakesApi, productsApi } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" }> = {
  draft: { label: "Đang đếm", variant: "secondary" },
  confirmed: { label: "Đã đóng", variant: "success" },
};

export default function StockTakesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stock-takes"],
    queryFn: () => stockTakesApi.list(),
  });

  const { data: allProducts } = useQuery({
    queryKey: ["products", { all: true }],
    queryFn: () => productsApi.list({ active_only: false }),
  });

  const PRODUCT_MAP = allProducts?.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = `${p.sku} — ${p.name}`;
    return acc;
  }, {});

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createNote, setCreateNote] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: { note?: string }) => stockTakesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-takes"] });
      setCreateOpen(false);
      setCreateNote("");
    },
  });

  // Detail dialog
  const [detailTakeId, setDetailTakeId] = useState<string | null>(null);
  const detailTake = data?.find((t) => t.id === detailTakeId);

  const [lineForm, setLineForm] = useState({
    product_id: "",
    system_qty: "",
    counted_qty: "",
  });

  const addLineMutation = useMutation({
    mutationFn: (body: { product_id: string; system_qty: number; counted_qty: number }) =>
      stockTakesApi.addLine(detailTakeId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-takes"] });
      if (detailTakeId) {
        queryClient.invalidateQueries({ queryKey: ["stock-take", detailTakeId] });
      }
      setLineForm({ product_id: "", system_qty: "", counted_qty: "" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => stockTakesApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-takes"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiểm kho</h1>
          <p className="text-gray-500 mt-1">Tạo phiên kiểm kho và so sánh tồn thực/tồn hệ thống</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Tạo phiên kiểm kho</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo phiên kiểm kho mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="note">Ghi chú</Label>
                <textarea
                  id="note"
                  value={createNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateNote(e.target.value)}
                  rows={2}
                  placeholder="Lý do kiểm kho..."
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                onClick={() => createMutation.mutate({ note: createNote || undefined })}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo phiên"}
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Huỷ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
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
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số dòng</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                      Chưa có phiên kiểm kho nào.
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((take) => (
                  <TableRow key={take.id}>
                    <TableCell>{formatDate(take.taken_at)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABEL[take.status]?.variant ?? "secondary"}>
                        {STATUS_LABEL[take.status]?.label ?? take.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{take.lines?.length ?? 0} dòng</TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                      {take.note ?? "—"}
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailTakeId(take.id)}
                      >
                        Chi tiết
                      </Button>
                      {take.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closeMutation.mutate(take.id)}
                          disabled={closeMutation.isPending}
                        >
                          Đóng phiên
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailTakeId} onOpenChange={(open) => !open && setDetailTakeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phiên kiểm kho</DialogTitle>
          </DialogHeader>
          {detailTake && (
            <div className="space-y-4 mt-2">
              <div className="flex gap-2 items-center">
                <Badge variant={STATUS_LABEL[detailTake.status]?.variant ?? "secondary"}>
                  {STATUS_LABEL[detailTake.status]?.label ?? detailTake.status}
                </Badge>
                <span className="text-sm text-gray-500">{formatDate(detailTake.taken_at)}</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Tồn hệ thống</TableHead>
                    <TableHead>Tồn thực tế</TableHead>
                    <TableHead>Chênh lệch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailTake.lines?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                        Chưa có dòng nào. Thêm dòng bên dưới.
                      </TableCell>
                    </TableRow>
                  )}
                  {detailTake.lines?.map((line) => {
                    const diff = line.counted_qty - line.system_qty;
                    return (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">
                          {PRODUCT_MAP?.[line.product_id] ?? line.product_id}
                        </TableCell>
                        <TableCell>{line.system_qty}</TableCell>
                        <TableCell>{line.counted_qty}</TableCell>
                        <TableCell>
                          <span
                            className={
                              diff === 0
                                ? "text-gray-500"
                                : diff > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                            }
                          >
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {detailTake.status === "draft" && (
                <div className="border rounded-md p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Thêm dòng so sánh</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label>Sản phẩm</Label>
                      <select
                        value={lineForm.product_id}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setLineForm((p) => ({ ...p, product_id: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Chọn</option>
                        {allProducts?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Tồn hệ thống</Label>
                      <Input
                        type="number"
                        value={lineForm.system_qty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLineForm((p) => ({ ...p, system_qty: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tồn thực tế</Label>
                      <Input
                        type="number"
                        value={lineForm.counted_qty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLineForm((p) => ({ ...p, counted_qty: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!lineForm.product_id || !lineForm.system_qty || !lineForm.counted_qty) return;
                          addLineMutation.mutate({
                            product_id: lineForm.product_id,
                            system_qty: Number(lineForm.system_qty),
                            counted_qty: Number(lineForm.counted_qty),
                          });
                        }}
                        disabled={
                          addLineMutation.isPending ||
                          !lineForm.product_id ||
                          !lineForm.system_qty ||
                          !lineForm.counted_qty
                        }
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {detailTake.status === "draft" && detailTake.lines.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => closeMutation.mutate(detailTake.id)}
                    disabled={closeMutation.isPending}
                  >
                    Đóng phiên kiểm kho
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
