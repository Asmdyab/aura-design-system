using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Plugins;
using Academy.Agent.Application.Prompts;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.Google;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Academy.Agent.Application;

public sealed class AgentEngine
{
    private readonly SemanticKernelOptions _skOptions;
    private readonly LlmOptions _llmOptions;
    private readonly ChatOptions _chatOptions;
    private readonly AgentContext _context;
    private readonly IConversationRepository _conversations;
    private readonly AcademyPlugin _academyPlugin;
    private readonly RegistrationPlugin _registrationPlugin;
    private readonly WhatsAppPlugin _whatsAppPlugin;
    private readonly SearchPlugin _searchPlugin;
    private readonly ILogger<AgentEngine> _logger;
    private readonly HttpClient _httpClient;

    public AgentEngine(
        IOptions<SemanticKernelOptions> skOptions,
        IOptions<LlmOptions> llmOptions,
        IOptions<ChatOptions> chatOptions,
        AgentContext context,
        IConversationRepository conversations,
        AcademyPlugin academyPlugin,
        RegistrationPlugin registrationPlugin,
        WhatsAppPlugin whatsAppPlugin,
        SearchPlugin searchPlugin,
        HttpClient httpClient,
        ILogger<AgentEngine> logger)
    {
        _skOptions = skOptions.Value;
        _llmOptions = llmOptions.Value;
        _chatOptions = chatOptions.Value;
        _context = context;
        _conversations = conversations;
        _academyPlugin = academyPlugin;
        _registrationPlugin = registrationPlugin;
        _whatsAppPlugin = whatsAppPlugin;
        _searchPlugin = searchPlugin;
        _httpClient = httpClient;
        _logger = logger;
    }

    public Task<string> GetGreetingAsync() => Task.FromResult(AssistantMessages.Greeting);

    public async Task<AgentRunResult> ReplyAsync(
        Conversation conversation,
        string userMessage,
        CancellationToken ct = default)
    {
        var reply = new StringBuilder();
        await foreach (var delta in StreamReplyAsync(conversation, userMessage, ct))
        {
            reply.Append(delta);
        }

        return new AgentRunResult(conversation.Id, reply.ToString());
    }

    public async IAsyncEnumerable<string> StreamReplyAsync(
        Conversation conversation,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        _context.CurrentConversation = conversation;

        var history = await _conversations.GetRecentMessagesAsync(conversation.Id, _chatOptions.MaxHistoryMessages, ct);
        await _conversations.AddMessageAsync(conversation.Id, "user", userMessage, ct);

        var chatHistory = BuildChatHistory(history, conversation, userMessage);
        var agent = CreateAgent();

        var reply = new StringBuilder();
        var streamed = false;
        var enumerator = agent
            .InvokeStreamingAsync(
                messages: chatHistory,
                thread: null,
                options: null,
                cancellationToken: ct)
            .GetAsyncEnumerator(ct);

        try
        {
            while (true)
            {
                bool hasNext;
                try
                {
                    hasNext = await enumerator.MoveNextAsync();
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Streaming agent turn failed (partial length {Length}).", reply.Length);
                    break;
                }

                if (!hasNext) break;

                var text = enumerator.Current.Message.ToString();
                if (string.IsNullOrWhiteSpace(text)) continue;

                streamed = true;
                reply.Append(text);
                yield return text;
            }
        }
        finally
        {
            await enumerator.DisposeAsync();
        }

        if (!streamed)
        {
            var fallback = await GetNonStreamingReplyAsync(agent, ct);
            reply.Append(fallback);
            yield return fallback;
        }

        await _conversations.AddMessageAsync(conversation.Id, "assistant", reply.ToString(), ct);
    }

    private ChatHistory BuildChatHistory(
        IReadOnlyList<ChatMessage> history,
        Conversation conversation,
        string userMessage)
    {
        var chat = new ChatHistory();
        chat.AddSystemMessage($"Session: conversationId={conversation.Id}, channel={conversation.Channel}, externalUserId={conversation.ExternalUserId}.");

        foreach (var m in history)
        {
            if (string.Equals(m.Role, "user", StringComparison.OrdinalIgnoreCase))
                chat.AddUserMessage(m.Content);
            else
                chat.AddAssistantMessage(m.Content);
        }

        chat.AddUserMessage(userMessage);
        return chat;
    }

    private ChatCompletionAgent CreateAgent()
    {
        var settings = LlmOptionsResolver.Resolve(_llmOptions, _skOptions);

        var builder = Kernel.CreateBuilder();

        PromptExecutionSettings executionSettings;
        if (settings.Provider == LlmProvider.OpenAI || settings.Provider == LlmProvider.OpenRouter)
        {
            if (string.IsNullOrWhiteSpace(settings.BaseUrl))
                builder.AddOpenAIChatCompletion(settings.ModelId, settings.ApiKey, httpClient: _httpClient);
            else
                builder.AddOpenAIChatCompletion(settings.ModelId, new Uri(settings.BaseUrl), settings.ApiKey, httpClient: _httpClient);
            executionSettings = new OpenAIPromptExecutionSettings
            {
                Temperature = settings.Temperature,
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
            };
        }
        else
        {
            builder.AddGoogleAIGeminiChatCompletion(settings.ModelId, settings.ApiKey, httpClient: _httpClient);
            executionSettings = new GeminiPromptExecutionSettings
            {
                Temperature = settings.Temperature,
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
            };
        }

        var kernel = builder.Build();

        kernel.Plugins.AddFromObject(_academyPlugin, "Academy");
        kernel.Plugins.AddFromObject(_registrationPlugin, "Registration");
        kernel.Plugins.AddFromObject(_whatsAppPlugin, "WhatsApp");
        kernel.Plugins.AddFromObject(_searchPlugin, "Search");

        return new ChatCompletionAgent
        {
            Kernel = kernel,
            Name = "AcademyAssistant",
            Instructions = SystemPrompt.Value,
            Arguments = new KernelArguments(executionSettings),
        };
    }

    private async Task<string> GetNonStreamingReplyAsync(ChatCompletionAgent agent, CancellationToken ct)
    {
        var chatHistory = new ChatHistory();
        var history = await _conversations.GetRecentMessagesAsync(_context.CurrentConversation!.Id, _chatOptions.MaxHistoryMessages, ct);
        foreach (var m in history)
        {
            if (string.Equals(m.Role, "user", StringComparison.OrdinalIgnoreCase))
                chatHistory.AddUserMessage(m.Content);
            else
                chatHistory.AddAssistantMessage(m.Content);
        }

        var reply = new StringBuilder();
        await foreach (var item in agent.InvokeAsync(
            messages: chatHistory,
            thread: null,
            options: null,
            cancellationToken: ct))
        {
            reply.Append(item.Message.Content ?? string.Empty);
        }

        return reply.ToString();
    }
}
