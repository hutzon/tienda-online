namespace TiendaOnline.Api.Modules.Commerce;

public static class OrderStatuses
{
    public const string Draft = "Draft";
    public const string PendingPayment = "PendingPayment";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
}

public static class PaymentStatuses
{
    public const string Pending = "Pending";
    public const string Authorized = "Authorized";
    public const string Paid = "Paid";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";
}

public static class PaymentMethods
{
    public const string OnlineSimulated = "OnlineSimulated";
    public const string CashOnDelivery = "CashOnDelivery";
}

public static class CheckoutSessionStatuses
{
    public const string Active = "Active";
    public const string Completed = "Completed";
    public const string Expired = "Expired";
}

public static class TrackingStatuses
{
    public const string OrderReceived = "OrderReceived";
    public const string Preparing = "Preparing";
    public const string Packed = "Packed";
    public const string InTransit = "InTransit";
    public const string Delivered = "Delivered";
    public const string Cancelled = "Cancelled";
}
