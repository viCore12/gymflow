export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xl font-bold text-white">GymFlow</span>
            <p className="mt-2 text-sm">
              Hệ thống quản lý phòng tập hiện đại, hiệu quả.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Liên hệ
            </h3>
            <ul className="space-y-2 text-sm">
              <li>Email: contact@gymflow.local</li>
              <li>Điện thoại: 0900 000 000</li>
              <li>Địa chỉ: TP. Hồ Chí Minh</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Mạng xã hội
            </h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
              <a href="#" className="hover:text-white transition-colors">Zalo</a>
              <a href="#" className="hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center">
          © 2026 GymFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
