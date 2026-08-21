import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export function parseTimeRange(start, end) {
  const startTime = new Date(start);
  const endTime = new Date(end);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(Problems.INVALID_DATE_FORMAT, {
      detail: "startTime i endTime maja nieprawidlowy format",
    });
  }

  if (startTime >= endTime) {
    throw new ApiError(Problems.INVALID_TIME_RANGE);
  }

  return { startTime, endTime };
}
