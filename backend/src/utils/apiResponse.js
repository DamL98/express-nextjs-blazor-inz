export class ApiResponse {
  constructor(statusCode, body, contentType = "application/json") {
    this.statusCode = statusCode;
    this.body = body;
    this.contentType = contentType;
  }

  static ok(data) {
    return new ApiResponse(200, {
      success: true,
      data,
    });
  }

  static created(data) {
    return new ApiResponse(201, {
      success: true,
      data,
    });
  }

  static problem(error, instance) {
    return new ApiResponse(
      error.status,
      error.toProblemDetails(instance),
      "application/problem+json",
    );
  }

  send(res) {
    res.status(this.statusCode);
    res.type(this.contentType);
    return res.json(this.body);
  }
}
