using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Agent.Application.Http;

internal sealed class GeminiFunctionRoleCompatibilityHandler : DelegatingHandler
{
    public GeminiFunctionRoleCompatibilityHandler(HttpMessageHandler innerHandler) : base(innerHandler) { }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.Content is { } content)
        {
            var body = await content.ReadAsStringAsync(cancellationToken);
            if (body.Contains("\"role\":\"function\""))
            {
                var rewritten = body.Replace("\"role\":\"function\"", "\"role\":\"user\"");
                request.Content = new StringContent(rewritten, Encoding.UTF8, "application/json");
            }
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
