export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Quản lý phòng tập{" "}
          <span className="text-primary-500">thông minh</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          GymFlow giúp bạn quản lý hội viên, gói tập, nhân viên và doanh thu
          trong một hệ thống duy nhất, dễ sử dụng.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            id="dang-ky"
            href="#dang-ky"
            className="inline-flex items-center justify-center rounded-md bg-primary-500 px-8 py-3 text-base font-medium text-white hover:bg-primary-600 transition-colors"
          >
            Đăng ký dùng thử
          </a>
          <a
            href="#tinh-nang"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>
    </section>
  );
}
