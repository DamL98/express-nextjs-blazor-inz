using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReservationStatus
{
    [JsonStringEnumMemberName("ACTIVE")]
    Active,

    [JsonStringEnumMemberName("CANCELLED")]
    Cancelled,
}
