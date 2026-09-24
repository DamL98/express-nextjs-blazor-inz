import { ApiResponse } from "../../utils/apiResponse.js";
import { sendSessionResponse } from "./session.response.js";
import * as service from "./local-auth.service.js";

const emailResponse = () => ApiResponse.ok({ message: "Wysłana wiadomosc z linkiem" });

export async function register(_req, res) {
  const data = res.locals.validated.body;

  if (await service.registerLocal(data)) {
    await service.requestEmailAction(data, "verify-email");
  }

  return emailResponse().send(res);
}

export async function login(_req, res) {
  const session = await service.loginLocal(res.locals.validated.body);
  return sendSessionResponse(res, session);
}

export function requestEmailAction(purpose) {
  return async (_req, res) => {
    await service.requestEmailAction(res.locals.validated.body, purpose);
    return emailResponse().send(res);
  };
}

export async function verifyEmail(_req, res) {
  await service.verifyEmail(res.locals.validated.body.token);
  return ApiResponse.ok({ message: "Adres potwierdzony. Mozesz sie zalogowac." }).send(res);
}

export async function resetPassword(_req, res) {
  await service.resetPassword(res.locals.validated.body);
  return ApiResponse.ok({ message: "Haslo zmienione. Zaloguj sie ponownie." }).send(res);
}

export async function changePassword(_req, res) {
  const session = await service.changePassword(res.locals.user, res.locals.validated.body);
  return sendSessionResponse(res, session);
}
