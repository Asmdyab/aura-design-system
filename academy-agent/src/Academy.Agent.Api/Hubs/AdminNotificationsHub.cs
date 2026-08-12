using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Academy.Agent.Api.Hubs;

[Authorize(Roles = "Admin")]
public class AdminNotificationsHub : Hub
{
}
