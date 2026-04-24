import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "CONFLICT",
  "INTERNAL_ERROR",
  "BAD_REQUEST",
  "RATE_LIMITED",
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Dữ liệu không hợp lệ",
  NOT_FOUND: "Không tìm thấy tài nguyên",
  UNAUTHORIZED: "Chưa xác thực",
  FORBIDDEN: "Không có quyền truy cập",
  CONFLICT: "Dữ liệu đã tồn tại",
  INTERNAL_ERROR: "Lỗi hệ thống",
  BAD_REQUEST: "Yêu cầu không hợp lệ",
  RATE_LIMITED: "Quá nhiều yêu cầu",
};
