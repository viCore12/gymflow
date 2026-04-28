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
import { stockLotsApi, productsApi } from "@/lib/api";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function getExpiryStatus(expiryDate: string | null): { label: string; variant: "success" | "destructive" | "warning" | "secondary" } {
  if (!expiryDate) return { label: "Không hạn", variant: "secondary" };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Đã hết hạn", variant: "destructive" };
  if (diffDays <= 7) return { label: `${diffDays} ngày nữa`, variant: "destructive" };
  if (diffDays <= 30) return { label: `${diffDays} ngày nữa`, variant: "warning" };
  return { label: `${diffDays} ngày nữa`, variant: "success" };
}

export default function StockLotsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stock-lots"],
    queryFn: () => stockLotsApi.list({}),
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
  const [createForm, setCreateForm] = useState({
    product_id: "",
    lot_number: "",
    qty: "",
    expiry_date: "",
  });

  const createMutation = useMutation({
    mutationFn: (body: { product_id: string; lot_number: string; qty: number; expiry_date?: string }) =>
      stockLotsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-lots"] });
      setCreateOpen(false);
      setCreateForm({ product_id: "", lot_number: "", qty: "", expiry_date: "" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lô hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý lô hàng và hạn sử dụng</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Thêm lô</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm lô hàng mới</DialogTitle>
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
                <Label htmlFor="lot_number">Mã lô</Label>
                <Input
                  id="lot_number"
                  value={createForm.lot_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((p) => ({ ...p, lot_number: e.target.value }))
                  }
                  placeholder="LOT-2024-001"
                />
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
                <Label htmlFor="expiry_date">Hạn sử dụng</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={createForm.expiry_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((p) => ({ ...p, expiry_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  if (!createForm.product_id || !createForm.lot_number || !createForm.qty) return;
                  createMutation.mutate({
                    product_id: createForm.product_id,
                    lot_number: createForm.lot_number,
                    qty: Number(createForm.qty),
                    expiry_date: createForm.expiry_date || undefined,
                  });
                }}
                disabled={
                  createMutation.isPending || !createForm.product_id || !createForm.lot_number || !createForm.qty
                }
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo lô"}
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
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                      Chưa có lô hàng nào.
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((lot) => {
                  const expiryStatus = getExpiryStatus(lot.expiry_date);
                  const isDepleted = lot.qty <= 0;
                  return (
                    <TableRow
                      key={lot.id}
                      className={isDepleted ? "opacity-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {PRODUCT_MAP?.[lot.product_id] ?? lot.product_id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{lot.lot_number}</TableCell>
                      <TableCell
                        className={lot.qty <= 0 ? "text-red-600 font-semibold" : ""}
                      >
                        {lot.qty}
                      </TableCell>
                      <TableCell>{formatDate(lot.expiry_date)}</TableCell>
                      <TableCell>
                        {!isDepleted && (
                          <Badge variant={expiryStatus.variant}>
                            {expiryStatus.label}
                          </Badge>
                        )}
                        {isDepleted && <Badge variant="destructive">Hết lô</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
