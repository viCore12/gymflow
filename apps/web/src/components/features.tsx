const FEATURES = [
  {
    icon: "👥",
    title: "Quản lý hội viên",
    description: "Theo dõi hồ sơ, lịch sử giao dịch và trạng thái gói tập của từng khách hàng.",
  },
  {
    icon: "📦",
    title: "Gói dịch vụ linh hoạt",
    description: "Tạo và quản lý các gói tập, gói thành viên với nhiều mức giá khác nhau.",
  },
  {
    icon: "👔",
    title: "Quản lý nhân sự",
    description: "Chấm công, tính lương và quản lý lịch làm việc của nhân viên và HLV.",
  },
  {
    icon: "📊",
    title: "Báo cáo doanh thu",
    description: "Tổng hợp và phân tích dữ liệu kinh doanh để đưa ra quyết định kịp thời.",
  },
];

export function Features() {
  return (
    <section id="tinh-nang" className="py-20 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Tính năng nổi bật</h2>
          <p className="mt-4 text-gray-500">Mọi thứ bạn cần để vận hành phòng tập hiệu quả</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
