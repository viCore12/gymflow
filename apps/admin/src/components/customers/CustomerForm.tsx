"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Label } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { customersApi, type Customer, type CustomerCreateBody, type CustomerUpdateBody, type Gender } from "@/lib/api";

interface CustomerFormProps {
  customer?: Customer;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!customer;

  const [form, setForm] = useState({
    full_name: customer?.full_name ?? "",
    phone: customer?.phone ?? "",
    dob: customer?.dob ?? "",
    gender: (customer?.gender ?? "") as Gender | "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Họ tên là bắt buộc";
    if (!form.phone.trim()) errs.phone = "Số điện thoại là bắt buộc";
    else if (form.phone.length > 20) errs.phone = "Số điện thoại tối đa 20 ký tự";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const createMutation = useMutation({
    mutationFn: (body: CustomerCreateBody) => customersApi.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push(`/customers/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: CustomerUpdateBody) => customersApi.update(customer!.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customer!.id] });
      router.push(`/customers/${data.id}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      full_name: form.full_name.trim(),
      ...(form.phone ? { phone: form.phone.trim() } : {}),
      ...(form.dob ? { dob: form.dob } : {}),
      ...(form.gender ? { gender: form.gender as Gender } : {}),
      ...(form.address ? { address: form.address.trim() } : {}),
      ...(form.notes ? { notes: form.notes.trim() } : {}),
    };

    if (isEdit) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Chỉnh sửa thông tin" : "Thêm khách hàng mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mutationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {mutationError.message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Họ tên */}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="full_name">
                Họ tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("full_name", e.target.value)}
                placeholder="Nguyễn Văn A"
              />
              {errors.full_name && (
                <p className="text-xs text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* SĐT */}
            <div className="space-y-1">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)}
                placeholder="0901234567"
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Ngày sinh */}
            <div className="space-y-1">
              <Label htmlFor="dob">Ngày sinh</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("dob", e.target.value)}
              />
            </div>

            {/* Giới tính */}
            <div className="space-y-1">
              <Label htmlFor="gender">Giới tính</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("gender", e.target.value as Gender | "")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Chọn giới tính</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("address", e.target.value)}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("notes", e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm..."
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo khách hàng"}
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
