export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: unknown;
  details?: unknown;
};
