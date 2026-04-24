"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Label } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import {
  staffApi,
  type Staff,
  type StaffCreateBody,
  type StaffUpdateBody,
  type StaffRole,
  type CommissionRate,
} from "@/lib/api";

interface StaffFormProps {
  staff?: Staff;
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "staff", label: "Nhân viên" },
  { value: "coach", label: "Huấn luyện viên" },
  { value: "manager", label: "Quản lý" },
];

function parseCommission(json: string | null): CommissionRate {
  if (!json) return { plan_sale_pct: 0, pt_session_rate_vnd: 0 };
  try {
    const parsed = JSON.parse(json);
    return {
      plan_sale_pct: parsed.plan_sale_pct ?? 0,
      pt_session_rate_vnd: parsed.pt_session_rate_vnd ?? 0,
    };
  } catch {
    return { plan_sale_pct: 0, pt_session_rate_vnd: 0 };
  }
}

export function StaffForm({ staff }: StaffFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!staff;

  const commission = parseCommission(staff?.commission_rate_json ?? null);

  const [form, setForm] = useState({
    full_name: staff?.full_name ?? "",
    phone: staff?.phone ?? "",
    email: staff?.email ?? "",
    role: (staff?.role ?? "staff") as StaffRole,
    hire_date: staff?.hire_date ?? "",
    base_salary: staff ? String(staff.base_salary) : "0",
    plan_sale_pct: String(commission.plan_sale_pct),
    pt_session_rate_vnd: String(commission.pt_session_rate_vnd),
    is_active: staff?.is_active ?? true,
    notes: staff?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Họ tên là bắt buộc";
    if (!form.hire_date) errs.hire_date = "Ngày vào làm là bắt buộc";
    if (form.phone && form.phone.length > 20) errs.phone = "Số điện thoại tối đa 20 ký tự";
    if (form.email && form.email.length > 255) errs.email = "Email tối đa 255 ký tự";
    const salary = parseFloat(form.base_salary);
    if (isNaN(salary) || salary < 0) errs.base_salary = "Lương cơ bản không hợp lệ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildCommissionJson(): string | undefined {
    const pct = parseFloat(form.plan_sale_pct);
    const rate = parseFloat(form.pt_session_rate_vnd);
    if (!isNaN(pct) || !isNaN(rate)) {
      return JSON.stringify({
        plan_sale_pct: isNaN(pct) ? 0 : pct,
        pt_session_rate_vnd: isNaN(rate) ? 0 : rate,
      });
    }
    return undefined;
  }

  const createMutation = useMutation({
    mutationFn: (body: StaffCreateBody) => staffApi.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      router.push(`/staff/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: StaffUpdateBody) => staffApi.update(staff!.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff", staff!.id] });
      router.push(`/staff/${data.id}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const commissionJson = buildCommissionJson();

    if (isEdit) {
      const body: StaffUpdateBody = {
        full_name: form.full_name.trim(),
        ...(form.phone ? { phone: form.phone.trim() } : { phone: undefined }),
        ...(form.email ? { email: form.email.trim() } : { email: undefined }),
        role: form.role,
        base_salary: parseFloat(form.base_salary) || 0,
        ...(commissionJson ? { commission_rate_json: commissionJson } : {}),
        is_active: form.is_active,
        ...(form.notes ? { notes: form.notes.trim() } : {}),
      };
      updateMutation.mutate(body);
    } else {
      const body: StaffCreateBody = {
        full_name: form.full_name.trim(),
        ...(form.phone ? { phone: form.phone.trim() } : {}),
        ...(form.email ? { email: form.email.trim() } : {}),
        role: form.role,
        hire_date: form.hire_date,
        base_salary: parseFloat(form.base_salary) || 0,
        ...(commissionJson ? { commission_rate_json: commissionJson } : {}),
        ...(form.notes ? { notes: form.notes.trim() } : {}),
      };
      createMutation.mutate(body);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mutationError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {mutationError.message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {errors.full_name && <p className="text-xs text-red-600">{errors.full_name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)}
                  placeholder="0901234567"
                />
                {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)}
                  placeholder="nhanvien@gymflow.vn"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="role">
                  Vị trí <span className="text-red-500">*</span>
                </Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("role", e.target.value as StaffRole)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="hire_date">
                  Ngày vào làm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={form.hire_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("hire_date", e.target.value)}
                />
                {errors.hire_date && <p className="text-xs text-red-600">{errors.hire_date}</p>}
              </div>

              {isEdit && (
                <div className="space-y-1 flex items-center gap-3 pt-6">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("is_active", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Label htmlFor="is_active">Đang làm việc</Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lương & Hoa hồng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="base_salary">Lương cơ bản (VND/tháng)</Label>
                <Input
                  id="base_salary"
                  type="number"
                  min="0"
                  step="100000"
                  value={form.base_salary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("base_salary", e.target.value)}
                  placeholder="0"
                />
                {errors.base_salary && <p className="text-xs text-red-600">{errors.base_salary}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan_sale_pct">Hoa hồng gói tập (%)</Label>
                <Input
                  id="plan_sale_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.plan_sale_pct}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("plan_sale_pct", e.target.value)}
                  placeholder="5"
                />
                <p className="text-xs text-gray-400">% giá gói tập HLV bán được</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pt_session_rate_vnd">Tiền/buổi PT (VND)</Label>
                <Input
                  id="pt_session_rate_vnd"
                  type="number"
                  min="0"
                  step="10000"
                  value={form.pt_session_rate_vnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("pt_session_rate_vnd", e.target.value)}
                  placeholder="50000"
                />
                <p className="text-xs text-gray-400">VND/buổi PT completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
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

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo nhân viên"}
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
      </div>
    </form>
  );
}
