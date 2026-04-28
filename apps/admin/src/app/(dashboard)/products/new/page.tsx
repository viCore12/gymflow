import { ProductForm } from "@/components/inventory/ProductForm";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm</h1>
        <p className="text-gray-500 mt-1">Tạo sản phẩm mới trong kho</p>
      </div>
      <ProductForm />
    </div>
  );
}
