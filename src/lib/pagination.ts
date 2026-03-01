export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function parsePaginationParams(
  searchParams: Record<string, string | string[] | undefined>
): PaginationParams {
  const rawPage = typeof searchParams.page === "string" ? searchParams.page : "1";
  const rawPageSize =
    typeof searchParams.pageSize === "string"
      ? searchParams.pageSize
      : String(DEFAULT_PAGE_SIZE);

  let page = parseInt(rawPage, 10);
  let pageSize = parseInt(rawPageSize, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(pageSize) || !PAGE_SIZE_OPTIONS.includes(pageSize as 10 | 20 | 50)) {
    pageSize = DEFAULT_PAGE_SIZE;
  }

  return { page, pageSize };
}

export function toRange({ page, pageSize }: PaginationParams): {
  from: number;
  to: number;
} {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function clampPage(page: number, totalPages: number): number {
  return Math.max(1, Math.min(page, totalPages));
}
