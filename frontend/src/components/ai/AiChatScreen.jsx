import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import SpeechToTextButton from "../voice/SpeechToText";
import TextReaderTwoButtons from "../voice/TextReaderAdvanced";
import api from "../../services/api";
import "./AiChatScreen.css";

// Component để render text với định dạng Markdown cơ bản
const FormattedMessage = ({ text }) => {
  const formatText = (text) => {
    if (!text) return "";

    // Xử lý **text** thành <strong>text</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Xử lý *text* thành <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Xử lý xuống hàng \n thành <br>
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
  };

  return (
    <div
      className="message-text"
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};

export default function AiChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Xin chào",
    "Giúp tôi với",
    "Cảm ơn",
    "Hẹn gặp lại",
    "Bạn là ai?",
    "Kể chuyện cười",
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { user: currentUser } = useAuth();

  // Khi input thay đổi, bật lại gợi ý nếu cần
  useEffect(() => {
    if (input === "") {
      setShowSuggestions(true);
    }
  }, [input]);

  // Tự động điều chỉnh chiều cao textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessage = useCallback(async () => {
    try {
      const res = await api.get("/api/ai-chat/history");
      if (res.data.success) {
        console.log("res.data: ", res.data.messages);
        setMessages(() => {
          return [
            ...res.data.messages,
            {
              role: "assistant",
              content:
                "Chào bạn, tôi là người bạn AI đây. Bạn có muốn chia sẻ điều gì hôm nay không?",
              timestamp: new Date(),
            },
          ];
        });
      }
    } catch (error) {
      console.log("Lỗi", error);
      // Nếu không lấy được lịch sử, hiển thị message mặc định
      setMessages([
        {
          role: "assistant",
          content:
            "Chào bạn, tôi là người bạn AI đây. Bạn có muốn chia sẻ điều gì hôm nay không?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Welcome message on component mount
  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  // Hàm xử lý khi có text từ Speech-to-Text
  const handleSpeechText = (text) => {
    setInput((prev) => (prev ? prev + " " + text : text));
  };

  // Hàm đọc tin nhắn AI
  const readAIMessage = () => {
    const lastAIMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant");
    if (lastAIMessage) {
      // Loại bỏ markdown khi đọc
      const cleanText = lastAIMessage.content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "vi-VN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const send = async (customMessage = null) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMsg = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (!customMessage) {
      setInput("");
    }

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Sử dụng webhook từ component AIChat

      const webhookUrl = "https://j0v0iinh.app.n8n.cloud/webhook/ai-anh";

      // const webhookUrl = "https://zzm0i0nhzz.app.n8n.cloud/webhook/ai-anh";

      // const webhookUrl = "http://localhost:5678/webhook/ai-anh";

      const response = await axios.post(webhookUrl, {
        userId: currentUser.id,
        message: messageToSend,
      });

      const assistantMsg = {
        role: "assistant",
        content: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Update suggestions based on context
      updateSuggestions(response.data.reply);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: "Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Lỗi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update suggestions based on AI response
  const updateSuggestions = (aiResponse) => {
    const responseLower = aiResponse.toLowerCase();
    let newSuggestions = [];

    if (responseLower.includes("chào") || responseLower.includes("xin chào")) {
      newSuggestions = [
        "Bạn là ai?",
        "Bạn có thể làm gì?",
        "Kể chuyện cười",
        "Giới thiệu về bạn",
      ];
    } else if (
      responseLower.includes("cảm ơn") ||
      responseLower.includes("thanks")
    ) {
      newSuggestions = [
        "Giúp tôi việc khác",
        "Tạm biệt",
        "Hẹn gặp lại",
        "Bạn thật tuyệt",
      ];
    } else if (
      responseLower.includes("chuyện") ||
      responseLower.includes("kể")
    ) {
      newSuggestions = [
        "Kể tiếp đi",
        "Chuyện khác đi",
        "Thật thú vị",
        "Kể về bạn",
      ];
    } else {
      newSuggestions = [
        "Giải thích rõ hơn",
        "Ví dụ cụ thể",
        "Câu hỏi liên quan",
        "Tôi cần giúp đỡ khác",
      ];
    }

    setSuggestions(newSuggestions);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Tạo các giá trị cho so sánh ngày
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dateDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Nếu là hôm nay
    if (dateDay.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Nếu là hôm qua
    if (dateDay.getTime() === yesterday.getTime()) {
      return (
        "Hôm qua, " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    // Nếu cách hơn 2 ngày thì hiển thị ngày đầy đủ
    const datePart = date.toLocaleDateString();
    const timePart = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${timePart}, ${datePart} `;
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chào bạn, tôi là người bạn AI đây. Bạn có muốn chia sẻ điều gì hôm nay không?",
        timestamp: new Date(),
      },
    ]);
  };

  // Copy message to clipboard
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // You can add a toast notification here
  };

  return (
    <div className="ai-chat-container  m-4">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-content">
          <div className="ai-header-main">
            <div className="ai-avatar">
              <div className="ai-avatar-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="29"
                  height="29"
                  viewBox="0 0 32 32"
                  fill="#fafafa"
                >
                  <g fill="#fafafa">
                    <path d="M13.472 26h5.056C19.34 26 20 25.326 20 24.5s-.66-1.5-1.472-1.5h-5.056C12.66 23 12 23.674 12 24.5s.66 1.5 1.472 1.5ZM10.5 10a4.5 4.5 0 1 0 0 9h11a4.5 4.5 0 1 0 0-9h-11Zm.75 2c.69 0 1.25.56 1.25 1.25v2.5a1.25 1.25 0 1 1-2.5 0v-2.5c0-.69.56-1.25 1.25-1.25Zm8.25 1.25a1.25 1.25 0 1 1 2.5 0v2.5a1.25 1.25 0 1 1-2.5 0v-2.5Z" />
                    <path d="M4 4.915a1.5 1.5 0 1 0-1 0v7.355a2 2 0 0 0-1 1.728v7.004c0 .736.403 1.382 1 1.729v1.319A6.945 6.945 0 0 0 9.95 31h12.1A6.943 6.943 0 0 0 29 24.06v-1.39c.597-.347 1-.994 1-1.73v-7.01c0-.736-.403-1.383-1-1.73V5.018a1.55 1.55 0 1 0-1 0v3.396A7.017 7.017 0 0 0 21.98 5h-1.065A1.5 1.5 0 0 0 19.5 3h-7a1.5 1.5 0 0 0-1.415 2H10.03C7.47 5 5.23 6.369 4 8.414v-3.5Zm1 7.115A5.03 5.03 0 0 1 10.03 7h11.95A5.028 5.028 0 0 1 27 12.03v12.03A4.943 4.943 0 0 1 22.05 29H9.95A4.945 4.945 0 0 1 5 24.05V12.03Z" />
                  </g>
                </svg>
              </div>
            </div>
            <div className="ai-chat-info">
              <h1 className="ai-chat-title">AI Người Bạn Đồng Hành</h1>
              <p className="ai-chat-subtitle">Trợ lý thông minh 24/7</p>
            </div>
          </div>

          <div className="ai-header-actions">
            {/* <div className="ai-status">
              <div className="ai-status-indicator"></div>
              <span className="ai-status-text">Online</span>
            </div> */}

            {/* Công cụ voice */}
            <div className="chat-tools me-3">
              <SpeechToTextButton
                onTextChange={handleSpeechText}
                buttonSize="sm"
                className="me-2"
              />
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={readAIMessage}
                title="Đọc tin nhắn AI cuối cùng"
              >
                <i className="fa-solid fa-volume-high "></i>
              </button>
            </div>

            <button
              className="ai-clear-chat-btn"
              onClick={clearChat}
              title="Xóa lịch sử chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Clear chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="ai-chat-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`ai-message-container ${
              m.role === "user" ? "ai-user-message" : "ai-assistant-message"
            }`}
          >
            <div className="ai-message-wrapper">
              {m.role === "assistant" && (
                <div className="ai-message-avatar ai-assistant-avatar">
                  <div className="ai-avatar-badge">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25"
                      height="25"
                      viewBox="0 0 32 32"
                      fill="#3788d8"
                    >
                      <g fill="#3788d8">
                        <path d="M13.472 26h5.056C19.34 26 20 25.326 20 24.5s-.66-1.5-1.472-1.5h-5.056C12.66 23 12 23.674 12 24.5s.66 1.5 1.472 1.5ZM10.5 10a4.5 4.5 0 1 0 0 9h11a4.5 4.5 0 1 0 0-9h-11Zm.75 2c.69 0 1.25.56 1.25 1.25v2.5a1.25 1.25 0 1 1-2.5 0v-2.5c0-.69.56-1.25 1.25-1.25Zm8.25 1.25a1.25 1.25 0 1 1 2.5 0v2.5a1.25 1.25 0 1 1-2.5 0v-2.5Z" />
                        <path d="M4 4.915a1.5 1.5 0 1 0-1 0v7.355a2 2 0 0 0-1 1.728v7.004c0 .736.403 1.382 1 1.729v1.319A6.945 6.945 0 0 0 9.95 31h12.1A6.943 6.943 0 0 0 29 24.06v-1.39c.597-.347 1-.994 1-1.73v-7.01c0-.736-.403-1.383-1-1.73V5.018a1.55 1.55 0 1 0-1 0v3.396A7.017 7.017 0 0 0 21.98 5h-1.065A1.5 1.5 0 0 0 19.5 3h-7a1.5 1.5 0 0 0-1.415 2H10.03C7.47 5 5.23 6.369 4 8.414v-3.5Zm1 7.115A5.03 5.03 0 0 1 10.03 7h11.95A5.028 5.028 0 0 1 27 12.03v12.03A4.943 4.943 0 0 1 22.05 29H9.95A4.945 4.945 0 0 1 5 24.05V12.03Z" />
                      </g>
                    </svg>
                  </div>
                </div>
              )}

              <div className="ai-message-content">
                <div
                  className={`ai-message-bubble ${
                    m.role === "user" ? "ai-user-bubble" : "ai-assistant-bubble"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <FormattedMessage text={m.content} />
                  ) : (
                    <p className="ai-message-text">{m.content}</p>
                  )}

                  {/* Message actions */}
                  <div className="ai-message-actions">
                    {m.role === "assistant" && (
                      <>
                        {m.content && (
                          <TextReaderTwoButtons
                            text={m.content
                              .replace(/\*\*(.*?)\*\*/g, "$1")
                              .replace(/\*(.*?)\*/g, "$1")}
                            height={30}
                            showSetupDefault={false}
                            children={
                              <button
                                className="ai-message-action-btn"
                                onClick={() => copyMessage(m.content)}
                                title="Sao chép tin nhắn"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                </svg>
                              </button>
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="ai-message-meta">
                  <span className="ai-message-time text-light">
                    {formatTime(m.timestamp || m.createdAt)}
                  </span>
                  {m.role === "user" && (
                    <span className="ai-message-sender">Bạn</span>
                  )}
                  {m.role === "assistant" && (
                    <span className="ai-message-sender text-light">
                      AI Assistant
                    </span>
                  )}
                </div>
              </div>

              {m.role === "user" && (
                <div className="ai-message-avatar ai-user-avatar">
                  <div className="ai-avatar-badge user">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25"
                      height="25"
                      viewBox="0 0 18 18"
                      fill="#000000"
                    >
                      <g fill="#000000" fill-rule="evenodd">
                        <path d="M13.689 11.132c1.155 1.222 1.953 2.879 2.183 4.748a1.007 1.007 0 0 1-1 1.12H3.007a1.005 1.005 0 0 1-1-1.12c.23-1.87 1.028-3.526 2.183-4.748c.247.228.505.442.782.633c-1.038 1.069-1.765 2.55-1.972 4.237L14.872 16c-.204-1.686-.93-3.166-1.966-4.235a7.01 7.01 0 0 0 .783-.633M8.939 1c1.9 0 3 2 4.38 2.633a2.483 2.483 0 0 1-1.88.867c-.298 0-.579-.06-.844-.157A3.726 3.726 0 0 1 7.69 5.75c-1.395 0-3.75.25-3.245-1.903C5.94 3 6.952 1 8.94 1" />
                        <path d="M8.94 2c2.205 0 4 1.794 4 4s-1.795 4-4 4c-2.207 0-4-1.794-4-4s1.793-4 4-4m0 9A5 5 0 1 0 8.937.999A5 5 0 0 0 8.94 11" />
                      </g>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="ai-message-container ai-assistant-message">
            <div className="ai-message-wrapper">
              <div className="ai-message-avatar ai-assistant-avatar">
                <div className="ai-avatar-badge">AI</div>
              </div>
              <div className="ai-message-content">
                <div className="ai-message-bubble ai-assistant-bubble ai-typing-indicator">
                  <div className="ai-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="ai-typing-text">Đang trả lời...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="ai-scroll-anchor" />
      </div>

      {/* Quick Suggestions */}
      {input === "" && suggestions.length > 0 && showSuggestions && (
        <div
          className="ai-suggestions-container"
          style={{ position: "relative" }}
        >
          <button
            className="close-btn"
            onClick={() => setShowSuggestions(false)}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.3)",
              border: "2px solid white",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              fontSize: "24px",
              fontWeight: "bold",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.3)";
            }}
          >
            ×
          </button>

          <div className="ai-suggestions-header">
            <span>Gợi ý nhanh:</span>
          </div>
          <div className="ai-suggestions-grid">
            {suggestions.map((text, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(text)}
                className="ai-suggestion-btn"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area với textarea thay vì input */}
      <div className="ai-chat-input-container">
        <div className="ai-chat-input-wrapper">
          <div className="ai-input-group">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn... (Shift + Enter để xuống hàng)"
                disabled={isLoading}
                rows={1}
                className="ai-chat-textarea"
              />
              <SpeechToTextButton
                onTextChange={handleSpeechText}
                buttonSize="sm"
                className="mic-button text-white"
              />
            </div>
            <button
              onClick={() => send()}
              disabled={isLoading || !input.trim()}
              className="ai-send-button"
              title="Gửi tin nhắn (Enter)"
            >
              {isLoading ? (
                <div className="ai-send-loader"></div>
              ) : (
                <svg className="ai-send-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ai-quick-actions">
          <div className="ai-quick-actions-info">
            <small>
              Mẹo: Nhấn Enter để gửi nhanh, Shift+Enter để xuống hàng
            </small>
          </div>
          <div className="ai-quick-actions-buttons">
            {["Xin chào", "Giúp tôi với", "Cảm ơn", "Hẹn gặp lại"].map(
              (text) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  className="ai-quick-action-btn"
                  disabled={isLoading}
                >
                  {text}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
