"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gymflow/ui";
import { Badge } from "@gymflow/ui";

export default function InventoryAlerts() {
  const router = useRouter();

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => inventoryApi.getLowStock({ threshold: 10 }),
  });

  const lowStockCount = lowStockItems?.length ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Cảnh báo tồn kho</h2>

      {isLoading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Low Stock Alert */}
          <Card className={lowStockCount > 0 ? "border-amber-300" : "border-green-300"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Sản phẩm hết hạn
                </CardTitle>
                <Badge variant={lowStockCount > 0 ? "destructive" : "success"}>
                  {lowStockCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockCount === 0 ? (
                <p className="text-sm text-green-600">Tất cả sản phẩm có đủ hàng.</p>
              ) : (
                <ul className="space-y-2">
                  {lowStockItems?.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="font-mono text-xs text-gray-500">{item.sku}</span>{" "}
                        {item.name}
                      </span>
                      <span className={`font-semibold ${item.stock <= 0 ? "text-red-600" : "text-amber-600"}`}>
                        {item.stock}
                      </span>
                    </li>
                  ))}
                  {lowStockCount > 5 && (
                    <li>
                      <button
                        className="text-sm text-primary-600 hover:text-primary-700"
                        onClick={() => router.push("/products")}
                      >
                        Xem tất cả ({lowStockCount} SP) →
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Expiring Lots Alert */}
          <Card className="border-amber-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Lô hàng sắp hết hạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Dữ liệu lô hàng sẽ hiển thị sau khi kết nối API backend.
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Thao tác nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  className="w-full text-left text-sm text-primary-600 hover:text-primary-700 py-1"
                  onClick={() => router.push("/products/new")}
                >
                  + Thêm sản phẩm mới
                </button>
                <button
                  className="w-full text-left text-sm text-primary-600 hover:text-primary-700 py-1"
                  onClick={() => router.push("/stock-lots")}
                >
                  → Thêm lô hàng
                </button>
                <button
                  className="w-full text-left text-sm text-primary-600 hover:text-primary-700 py-1"
                  onClick={() => router.push("/stock-moves")}
                >
                  → Tạo phiếu xuất/nhập
                </button>
                <button
                  className="w-full text-left text-sm text-primary-600 hover:text-primary-700 py-1"
                  onClick={() => router.push("/stock-takes")}
                >
                  → Tạo phiên kiểm kho
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
