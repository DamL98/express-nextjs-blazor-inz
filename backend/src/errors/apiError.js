export class ApiError extends Error {
  constructor(problem, { detail = problem.detail, cause } = {}) {
    super(detail, cause ? { cause } : undefined);

    this.name = "ApiError";
    this.type = problem.type;
    this.title = problem.title;
    this.status = problem.status;
    this.code = problem.code;
  }

  toProblemDetails(instance) {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.message,
      instance,
      code: this.code,
    };
  }
}
