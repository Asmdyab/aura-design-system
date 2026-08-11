using System;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;

var sb = new StringBuilder();
void W(string s) => sb.AppendLine(s);

var agent = typeof(ChatCompletionAgent);
W("ASSEMBLY: " + agent.Assembly.FullName);
W("BASE: " + agent.BaseType.FullName);
W("== ChatCompletionAgent all public instance methods (flat) ==");
foreach (var m in agent.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.FlattenHierarchy))
    if (m.Name.StartsWith("Invoke"))
        W($"[{m.DeclaringType.Name}] {m.ReturnType.Name} {m.Name}({string.Join(", ", m.GetParameters().Select(p => p.ParameterType.Name + " " + p.Name))})");

var hagent = typeof(ChatHistoryAgent);
W("== ChatHistoryAgent base methods ==");
foreach (var m in hagent.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly))
    if (m.Name.StartsWith("Invoke"))
        W($"[{m.DeclaringType.Name}] {m.ReturnType.Name} {m.Name}({string.Join(", ", m.GetParameters().Select(p => p.ParameterType.Name + " " + p.Name))})");

W("== Agent base props ==");
foreach (var p in typeof(Agent).GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.FlattenHierarchy))
    W($"{p.PropertyType.Name} {p.Name} [{p.DeclaringType.Name}]");

W("== KernelArguments ==");
W("FullName: " + typeof(KernelArguments).FullName);
W("IsClass: " + typeof(KernelArguments).IsClass + " IsInterface: " + typeof(KernelArguments).IsInterface);
foreach (var c in typeof(KernelArguments).GetConstructors()) W("Ctor: " + c.ToString());
W("BaseType: " + (typeof(KernelArguments).BaseType?.FullName ?? "none"));
var itfs = typeof(KernelArguments).GetInterfaces();
foreach (var i in itfs) W("Interface: " + i.FullName);

File.WriteAllText("apiresult.txt", sb.ToString());