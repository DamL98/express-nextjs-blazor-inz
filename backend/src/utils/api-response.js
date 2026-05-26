export function successResponse(data) {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}