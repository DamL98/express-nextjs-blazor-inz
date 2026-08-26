using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Models.DTOs;

public sealed class LocalUserDto
{
    public string Id { get; init; } = string.Empty;

    public string GoogleId { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string FullName { get; init; } = string.Empty;

    public string? AvatarUrl { get; init; }

    [JsonPropertyName("emailVerified")]
    public bool IsEmailVerified { get; init; }

    public UserRoleDto Role { get; init; } = new();
}
