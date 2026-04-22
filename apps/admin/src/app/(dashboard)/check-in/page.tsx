"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gymflow/ui";
import { Input } from "@gymflow/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gymflow/ui";
import { customersApi, checkinsApi, type CustomerListItem } from "@/lib/api";

export default function CheckInPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState("");

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 350);
    // Reset selection when query changes
    if (selectedCustomer) {
      setSelectedCustomer(null);
      setCheckInSuccess(false);
      setCheckInError("");
    }
  }, [selectedCustomer]);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["customer-search", debouncedQuery],
    queryFn: () => customersApi.list({ q: debouncedQuery, per_page: 8 }),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: customerDetail } = useQuery({
    queryKey: ["customer", selectedCustomer?.id],
    queryFn: () => customersApi.get(selectedCustomer!.id),
    enabled: !!selectedCustomer?.id,
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkinsApi.create(selectedCustomer!.id),
    onSuccess: () => {
      setCheckInSuccess(true);
      setCheckInError("");
      queryClient.invalidateQueries({ queryKey: ["checkins", selectedCustomer!.id] });
    },
    onError: (err: Error) => {
      setCheckInError(err.message);
    },
  });

  function handleSelectCustomer(c: CustomerListItem) {
    setSelectedCustomer(c);
    setQuery(c.full_name);
    setCheckInSuccess(false);
    setCheckInError("");
  }

  function handleReset() {
    setSelectedCustomer(null);
    setQuery("");
    setDebouncedQuery("");
    setCheckInSuccess(false);
    setCheckInError("");
  }

  const showDropdown =
    !selectedCustomer &&
    debouncedQuery.length >= 2 &&
    (searchLoading || (searchResults?.items.length ?? 0) > 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
        <p className="text-gray-500 mt-1">Tìm khách hàng để ghi nhận check-in</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Nhập tên hoặc số điện thoại (ít nhất 2 ký tự)..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value)}
              autoFocus
            />

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
                {searchLoading && (
                  <p className="px-4 py-3 text-sm text-gray-500">Đang tìm...</p>
                )}
                {!searchLoading && searchResults?.items.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    Không tìm thấy khách hàng.
                  </p>
                )}
                {!searchLoading &&
                  searchResults?.items.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 border-gray-100 transition-colors"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <p className="font-medium text-sm">{c.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {c.phone ?? "Không có SĐT"} · {c.code}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
            <p className="text-xs text-gray-400">Nhập thêm để tìm kiếm...</p>
          )}
        </CardContent>
      </Card>

      {/* Selected customer card */}
      {selectedCustomer && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{customerDetail?.full_name ?? selectedCustomer.full_name}</CardTitle>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{selectedCustomer.code}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                ✕ Đổi KH
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer info */}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">Số điện thoại</dt>
                <dd className="font-medium">{selectedCustomer.phone ?? "—"}</dd>
              </div>
              {customerDetail?.dob && (
                <div>
                  <dt className="text-gray-500">Ngày sinh</dt>
                  <dd className="font-medium">
                    {new Date(customerDetail.dob).toLocaleDateString("vi-VN")}
                  </dd>
                </div>
              )}
            </dl>

            {/* Active packages — placeholder until E3-BE-1 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Gói dịch vụ</p>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-500">
                Dữ liệu gói sẽ hiển thị sau khi E3-BE-1 hoàn thành.
              </div>
            </div>

            {/* Success/error state */}
            {checkInSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-green-700 text-sm">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-medium">Check-in thành công!</p>
                  <p className="text-xs text-green-600">
                    {new Date().toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            )}

            {checkInError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {checkInError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {!checkInSuccess ? (
                <Button
                  className="flex-1"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? "Đang ghi nhận..." : "✅ Check-in"}
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleReset}>
                  Check-in khách tiếp theo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
