import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";

const STATS = [
  { label: "Khách hàng", value: "—", badge: "Sắp có" },
  { label: "Gói hoạt động", value: "—", badge: "Sắp có" },
  { label: "Nhân viên", value: "—", badge: "Sắp có" },
  { label: "Doanh thu tháng", value: "—", badge: "Sắp có" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to GymFlow Admin</h1>
        <p className="text-gray-500 mt-1">Bảng điều khiển quản lý phòng tập</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stat.value}</span>
                <Badge variant="secondary">{stat.badge}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Dữ liệu sẽ hiển thị sau khi kết nối API backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
