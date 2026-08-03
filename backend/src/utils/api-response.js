export class ApiResponse {
  constructor(statusCode, body, statusMessage = null) {
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.body = body;
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

  static fromError(error) {
    return new ApiResponse(
      error.statusCode,
      {
        success: false,
        error: error.toPayload(),
      },
      error.statusMessage,
    );
  }

  send(res) {
    res.status(this.statusCode);

    if (this.statusMessage) {
      res.statusMessage = this.statusMessage;
    }

    return res.json(this.body);
  }
}
