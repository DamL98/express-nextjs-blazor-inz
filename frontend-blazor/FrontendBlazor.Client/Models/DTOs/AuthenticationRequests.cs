namespace FrontendBlazor.Client.Models.DTOs;

public sealed record LoginRequest(string Email, string Password);

public sealed record AccountEmailRequest(string Email, string Password, string FullName, string RedirectTo);

public sealed record AccountActionRequest(string Token, string Password);

public sealed record ChangePasswordRequest(string CurrentPassword, string Password);

public sealed record LinkGoogleRequest(string Password, string RedirectTo);
