"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Label } from "@gymflow/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gymflow/ui";
import { staffApi, shiftsApi, type StaffRole, type CommissionRate, type ShiftCreateBody } from "@/lib/api";
import { StaffForm } from "@/components/staff/StaffForm";

const ROLE_LABEL: Record<StaffRole, string> = {
  staff: "Nhân viên",
  coach: "Huấn luyện viên",
  manager: "Quản lý",
};

const SHIFT_TYPES = ["regular", "morning", "afternoon", "evening", "overtime"];
const SHIFT_TYPE_LABEL: Record<string, string> = {
  regular: "Thường",
  morning: "Ca sáng",
  afternoon: "Ca chiều",
  evening: "Ca tối",
  overtime: "Tăng ca",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

function parseCommission(json: string | null): CommissionRate | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as CommissionRate;
  } catch {
    return null;
  }
}

function formatCurrency(val: string | number) {
  return Number(val).toLocaleString("vi-VN") + " ₫";
}

type Tab = "info" | "shifts" | "edit";

interface AddShiftFormProps {
  staffId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddShiftForm({ staffId, onSuccess, onCancel }: AddShiftFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    shift_type: "regular",
    notes: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (body: ShiftCreateBody) => shiftsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-shifts", staffId] });
      onSuccess();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.start_time || !form.end_time) {
      setError("Vui lòng điền đầy đủ ngày, giờ bắt đầu và giờ kết thúc");
      return;
    }
    setError("");
    mutation.mutate({
      staff_id: staffId,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      shift_type: form.shift_type,
      ...(form.notes ? { notes: form.notes } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Thêm ca làm việc</h3>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="shift_date">Ngày</Label>
          <Input
            id="shift_date"
            type="date"
            value={form.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, date: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="start_time">Giờ bắt đầu</Label>
          <Input
            id="start_time"
            type="time"
            value={form.start_time}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, start_time: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_time">Giờ kết thúc</Label>
          <Input
            id="end_time"
            type="time"
            value={form.end_time}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, end_time: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="shift_type">Loại ca</Label>
          <select
            id="shift_type"
            value={form.shift_type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setForm((f) => ({ ...f, shift_type: e.target.value }))
            }
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {SHIFT_TYPES.map((t) => (
              <option key={t} value={t}>
                {SHIFT_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="shift_notes">Ghi chú</Label>
        <Input
          id="shift_notes"
          value={form.notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, notes: e.target.value }))
          }
          placeholder="Tuỳ chọn"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu..." : "Lưu ca"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("info");
  const [showAddShift, setShowAddShift] = useState(false);
  const [shiftPage, setShiftPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: staff, isLoading, isError } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => staffApi.get(id),
    enabled: !!id,
  });

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["staff-shifts", id, shiftPage, dateFrom, dateTo],
    queryFn: () =>
      shiftsApi.list({
        staff_id: id,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: shiftPage,
        per_page: 20,
      }),
    enabled: !!id && tab === "shifts",
  });

  const cancelShiftMutation = useMutation({
    mutationFn: (shiftId: string) => shiftsApi.update(shiftId, { is_cancelled: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-shifts", id] });
    },
  });

  if (isLoading) {
    return <p className="text-gray-500">Đang tải thông tin nhân viên...</p>;
  }

  if (isError || !staff) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Không tìm thấy nhân viên.</p>
        <Button variant="outline" onClick={() => router.back()}>
          ← Quay lại
        </Button>
      </div>
    );
  }

  const commission = parseCommission(staff.commission_rate_json);
  const shiftTotalPages = shifts ? Math.ceil(shifts.total / shifts.per_page) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
            onClick={() => router.push("/staff")}
          >
            ← Danh sách nhân viên
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{staff.full_name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                staff.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {staff.is_active ? "Đang làm" : "Đã nghỉ"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 text-sm font-mono">{staff.employee_code}</p>
            <Badge variant="secondary">{ROLE_LABEL[staff.role]}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => setTab("edit")}>
          Chỉnh sửa
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {(["info", "shifts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "info" && "Thông tin"}
              {t === "shifts" && "Ca làm việc"}
            </button>
          ))}
        </nav>
      </div>

      {/* Edit form */}
      {tab === "edit" && (
        <div className="max-w-2xl">
          <StaffForm staff={staff} />
        </div>
      )}

      {/* Info tab */}
      {tab === "info" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Số điện thoại</dt>
                  <dd className="font-medium">{staff.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{staff.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Vị trí</dt>
                  <dd>
                    <Badge variant="secondary">{ROLE_LABEL[staff.role]}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ngày vào làm</dt>
                  <dd className="font-medium">{formatDate(staff.hire_date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ngày tạo hồ sơ</dt>
                  <dd className="font-medium">{formatDate(staff.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lương & Hoa hồng</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lương cơ bản</dt>
                  <dd className="font-medium">{formatCurrency(staff.base_salary)}/tháng</dd>
                </div>
                {commission ? (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Hoa hồng gói tập</dt>
                      <dd className="font-medium">{commission.plan_sale_pct}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Tiền/buổi PT</dt>
                      <dd className="font-medium">{formatCurrency(commission.pt_session_rate_vnd)}/buổi</dd>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-xs">Chưa cấu hình hoa hồng</div>
                )}
              </dl>
            </CardContent>
          </Card>

          {staff.notes && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{staff.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Shifts tab */}
      {tab === "shifts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDateFrom(e.target.value);
                    setShiftPage(1);
                  }}
                  className="w-40"
                />
                <span className="text-gray-400 text-sm">→</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDateTo(e.target.value);
                    setShiftPage(1);
                  }}
                  className="w-40"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setShiftPage(1);
                  }}
                >
                  Xoá bộ lọc
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => setShowAddShift(true)}>
              + Thêm ca
            </Button>
          </div>

          {showAddShift && (
            <AddShiftForm
              staffId={id}
              onSuccess={() => setShowAddShift(false)}
              onCancel={() => setShowAddShift(false)}
            />
          )}

          <Card>
            <CardContent className="p-0">
              {shiftsLoading && (
                <p className="p-6 text-sm text-gray-500">Đang tải...</p>
              )}
              {!shiftsLoading && shifts?.items.length === 0 && (
                <p className="p-6 text-sm text-gray-500 text-center">
                  Không có ca làm việc nào trong khoảng thời gian này.
                </p>
              )}
              {!shiftsLoading && shifts && shifts.items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Loại ca</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.items.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.date}</TableCell>
                        <TableCell className="text-gray-600">
                          {shift.start_time} – {shift.end_time}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {SHIFT_TYPE_LABEL[shift.shift_type] ?? shift.shift_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shift.is_cancelled ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600">
                              Đã huỷ
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                              Hoạt động
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!shift.is_cancelled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelShiftMutation.mutate(shift.id)}
                            >
                              Huỷ ca
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {shiftTotalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t text-sm">
                <span className="text-gray-500">
                  Trang {shiftPage} / {shiftTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shiftPage <= 1}
                    onClick={() => setShiftPage((p) => p - 1)}
                  >
                    ← Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shiftPage >= shiftTotalPages}
                    onClick={() => setShiftPage((p) => p + 1)}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
