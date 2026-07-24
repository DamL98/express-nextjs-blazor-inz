using System.Text.Json.Serialization;

namespace FrontendBlazor.Client.Features.Reservations;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReservationStatus
{
    ACTIVE,
    CANCELLED,
}
