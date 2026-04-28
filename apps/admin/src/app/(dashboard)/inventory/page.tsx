import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gymflow/ui";
import InventoryAlerts from "@/components/inventory/InventoryAlerts";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kho hàng</h1>
        <p className="text-gray-500 mt-1">Quản lý tồn kho, phiếu nhập/xuất, lô hàng và kiểm kho</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a href="/products" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Quản lý sản phẩm</p>
              <p className="text-sm text-gray-500 mt-1">Tạo, cập nhật thông tin SP</p>
            </CardContent>
          </Card>
        </a>

        <a href="/stock-moves" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Phiếu nhập/xuất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Quản lý phiếu</p>
              <p className="text-sm text-gray-500 mt-1">Nhập kho, xuất kho, duyệt</p>
            </CardContent>
          </Card>
        </a>

        <a href="/stock-lots" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Lô hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Theo dõi lô hàng</p>
              <p className="text-sm text-gray-500 mt-1">Hạn sử dụng, cảnh báo</p>
            </CardContent>
          </Card>
        </a>

        <a href="/stock-takes" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Kiểm kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Phiên kiểm kho</p>
              <p className="text-sm text-gray-500 mt-1">Đối chiếu tồn thực/thị</p>
            </CardContent>
          </Card>
        </a>
      </div>

      <InventoryAlerts />
    </div>
  );
}
