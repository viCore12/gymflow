"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Badge } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gymflow/ui";
import { customersApi, checkinsApi } from "@/lib/api";
import { CustomerForm } from "@/components/customers/CustomerForm";

const GENDER_LABEL: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

type Tab = "info" | "checkins" | "edit";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [checkInPage, setCheckInPage] = useState(1);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });

  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ["checkins", id, checkInPage],
    queryFn: () => checkinsApi.listByCustomer(id, { page: checkInPage, per_page: 20 }),
    enabled: !!id && tab === "checkins",
  });

  if (isLoading) {
    return <p className="text-gray-500">Đang tải thông tin khách hàng...</p>;
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Không tìm thấy khách hàng.</p>
        <Button variant="outline" onClick={() => router.back()}>
          ← Quay lại
        </Button>
      </div>
    );
  }

  const checkInTotalPages = checkIns
    ? Math.ceil(checkIns.total / checkIns.per_page)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
            onClick={() => router.push("/customers")}
          >
            ← Danh sách khách hàng
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
          <p className="text-gray-500 text-sm font-mono">{customer.code}</p>
        </div>
        <Button variant="outline" onClick={() => setTab("edit")}>
          Chỉnh sửa
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {(["info", "checkins"] as Tab[]).map((t) => (
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
              {t === "checkins" && "Lịch sử check-in"}
            </button>
          ))}
        </nav>
      </div>

      {/* Edit form */}
      {tab === "edit" && (
        <div className="max-w-2xl">
          <CustomerForm customer={customer} />
        </div>
      )}

      {/* Profile info */}
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
                  <dd className="font-medium">{customer.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ngày sinh</dt>
                  <dd className="font-medium">
                    {customer.dob ? formatDate(customer.dob) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Giới tính</dt>
                  <dd>
                    {customer.gender ? (
                      <Badge variant="secondary">{GENDER_LABEL[customer.gender]}</Badge>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Địa chỉ</dt>
                  <dd className="font-medium text-right max-w-[200px]">
                    {customer.address ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ngày tạo</dt>
                  <dd className="font-medium">{formatDate(customer.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gói dịch vụ đang hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Dữ liệu gói dịch vụ sẽ hiển thị sau khi E3-BE-1 hoàn thành.
              </p>
            </CardContent>
          </Card>

          {customer.notes && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Check-in history */}
      {tab === "checkins" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Lịch sử check-in{" "}
              {checkIns && (
                <span className="text-gray-500 font-normal text-sm">
                  ({checkIns.total} lần)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {checkInsLoading && (
              <p className="p-6 text-sm text-gray-500">Đang tải...</p>
            )}
            {!checkInsLoading && checkIns?.items.length === 0 && (
              <p className="p-6 text-sm text-gray-500 text-center">
                Chưa có lịch sử check-in.
              </p>
            )}
            {!checkInsLoading && checkIns && checkIns.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian check-in</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.items.map((ci) => (
                    <TableRow key={ci.id}>
                      <TableCell>{formatDateTime(ci.checked_in_at)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ci.method}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {ci.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {checkInTotalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t text-sm">
              <span className="text-gray-500">
                Trang {checkInPage} / {checkInTotalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={checkInPage <= 1}
                  onClick={() => setCheckInPage((p) => p - 1)}
                >
                  ← Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={checkInPage >= checkInTotalPages}
                  onClick={() => setCheckInPage((p) => p + 1)}
                >
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
