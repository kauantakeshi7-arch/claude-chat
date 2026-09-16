"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Message { role: "user" | "assistant"; content: string; }

export default function ChatClient({ username }: { username: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `Erro: ${err.error}` }; return u; });
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: u[u.length - 1].content + parsed.text }; return u; });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "Erro de conexão." }; return u; });
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login"); router.refresh();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <span className="font-semibold text-white">Claude Chat</span>
        <div className="flex items-center gap-3">
          {messages.length > 0 && <button onClick={() => setMessages([])} className="text-xs text-gray-400 hover:text-gray-200">Nova conversa</button>}
          <span className="text-xs text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400">Sair</button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-xl font-semibold text-white mb-2">Olá, {username}!</h2>
            <p className="text-gray-400 text-sm">Comece digitando uma mensagem abaixo.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${msg.role === "user" ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-gray-700 text-gray-300 border border-gray-600"}`}>
                  {msg.role === "user" ? username[0].toUpperCase() : "C"}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-orange-500/15 text-gray-100 border border-orange-500/20" : "bg-gray-800/70 text-gray-100 border border-gray-700/50"}`}>
                  {msg.content || <span className="text-gray-500">...</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="border-t border-gray-800 bg-gray-900/50 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Escreva uma mensagem..." rows={1} disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none transition disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "200px" }} />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-white transition-colors">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
