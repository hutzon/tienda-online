using System.Text;
using System.Text.RegularExpressions;

namespace TiendaOnline.Api.Modules.Commerce;

internal static partial class CommerceText
{
    public static string ToSlug(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant();
        normalized = normalized.Normalize(NormalizationForm.FormD);

        var builder = new StringBuilder();
        foreach (var ch in normalized)
        {
            var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        var cleaned = builder.ToString().Normalize(NormalizationForm.FormC);
        cleaned = NonSlugChars().Replace(cleaned, "-");
        return cleaned.Trim('-');
    }

    public static string GenerateOrderNumber()
    {
        var suffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{suffix}";
    }

    [GeneratedRegex("[^a-z0-9]+", RegexOptions.Compiled)]
    private static partial Regex NonSlugChars();
}
