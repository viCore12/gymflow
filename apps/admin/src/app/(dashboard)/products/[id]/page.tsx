"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { productsApi } from "@/lib/api";
import { ProductForm } from "@/components/inventory/ProductForm";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

type Tab = "info" | "edit";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>;
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Không tìm thấy sản phẩm.</p>
        <Button variant="outline" onClick={() => router.back()}>
          ← Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
            onClick={() => router.push("/products")}
          >
            ← Danh sách sản phẩm
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-500 text-sm font-mono">{product.sku}</p>
        </div>
        <Button variant="outline" onClick={() => setTab("edit")}>
          Chỉnh sửa
        </Button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {(["info", "edit"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "info" ? "Thông tin" : "Chỉnh sửa"}
            </button>
          ))}
        </nav>
      </div>

      {tab === "edit" && (
        <div className="max-w-2xl">
          <ProductForm product={product} />
        </div>
      )}

      {tab === "info" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mã SKU</dt>
                  <dd className="font-medium font-mono">{product.sku}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tên sản phẩm</dt>
                  <dd className="font-medium">{product.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Giá bán</dt>
                  <dd className="font-medium">{formatCurrency(product.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tồn kho</dt>
                  <dd>
                    {product.stock <= 0 ? (
                      <span className="text-red-600 font-semibold">{product.stock}</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-amber-600 font-semibold">{product.stock}</span>
                    ) : (
                      <span className="font-medium">{product.stock}</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Trạng thái</dt>
                  <dd>
                    {product.active ? (
                      <Badge variant="success">Đang bán</Badge>
                    ) : (
                      <Badge variant="secondary">Ngừng bán</Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
