import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm khách hàng</h1>
        <p className="text-gray-500 mt-1">Tạo hồ sơ khách hàng mới</p>
      </div>
      <CustomerForm />
    </div>
  );
}
