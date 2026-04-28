"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Label } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { productsApi, type Product, type ProductCreateBody, type ProductUpdateBody } from "@/lib/api";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "0",
    active: product?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.sku.trim()) errs.sku = "Mã SKU là bắt buộc";
    if (!form.name.trim()) errs.name = "Tên sản phẩm là bắt buộc";
    if (!form.price.trim()) errs.price = "Giá bán là bắt buộc";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = "Giá bán không hợp lệ";
    if (form.stock.trim() && (isNaN(Number(form.stock)) || Number(form.stock) < 0)) errs.stock = "Số lượng không hợp lệ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const createMutation = useMutation({
    mutationFn: (body: ProductCreateBody) => productsApi.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/products/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: ProductUpdateBody) => productsApi.update(product!.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", product!.id] });
      router.push(`/products/${data.id}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      active: form.active,
    };

    if (isEdit) {
      updateMutation.mutate({
        name: body.name,
        price: body.price,
        stock: body.stock,
        active: body.active,
      });
    } else {
      createMutation.mutate(body);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mutationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {mutationError.message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sku">
                Mã SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="SP001"
              />
              {errors.sku && <p className="text-xs text-red-600">{errors.sku}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">
                Tên sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Bình nước tập gym 500ml"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">
                Giá bán (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="50000"
              />
              {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="stock">Tồn kho</Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
              />
              {errors.stock && <p className="text-xs text-red-600">{errors.stock}</p>}
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <Label htmlFor="active" className="mb-0">Đang bán</Label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo sản phẩm"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Huỷ
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
