using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReservationStatus
{
    ACTIVE,
    CANCELLED,
}
