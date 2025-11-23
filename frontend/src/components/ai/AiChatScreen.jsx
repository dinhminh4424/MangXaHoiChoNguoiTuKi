import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

export default function AiChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const { user: currentUser } = useAuth();

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await axios.post(
        // "https://dinhcongminh.app.n8n.cloud/webhook/ai-anh",
        "https://dinhcongminh.app.n8n.cloud/webhook-test/ai-anh",
        {
          userId: currentUser.id, // ← Thay bằng ID thật của người dùng sau
          message: input,
        }
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ánh đang bận chút xíu, bạn đợi nhé ❤️" },
      ]);
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-[#6A9B9A] text-white p-5 text-center text-lg font-semibold shadow-md">
        Ánh – Người bạn đồng hành
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                m.role === "user"
                  ? "bg-[#6A9B9A] text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Nói gì đó với Ánh nè..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[#6A9B9A]"
          />
          <button
            onClick={send}
            className="bg-[#6A9B9A] hover:bg-[#55807f] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
