// import React, { useState, useRef, useEffect } from "react";
// import SpeechToTextButton from "../voice/SpeechToText";
// import TextReaderTwoButtons from "../voice/TextReaderAdvanced";
// import "./AIChat.css";

// const AIChat = () => {
//   const [messages, setMessages] = useState([
//     {
//       text: "Chào bạn, tôi là người bạn AI đây. Bạn có muốn chia sẻ điều gì hôm nay không?",
//       type: "ai-message",
//     },
//   ]);
//   const [userInput, setUserInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const chatBoxRef = useRef(null);

//   // Tự động cuộn xuống tin nhắn mới nhất
//   useEffect(() => {
//     if (chatBoxRef.current) {
//       chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
//     }
//   }, [messages]);

//   // Hàm xử lý khi có text từ Speech-to-Text
//   const handleSpeechText = (text) => {
//     setUserInput(text);
//   };

//   // Hàm đọc tin nhắn AI
//   const readAIMessage = () => {
//     const lastAIMessage = [...messages]
//       .reverse()
//       .find((msg) => msg.type === "ai-message");
//     if (lastAIMessage) {
//       // Tạo một TextReaderTwoButtons tạm thời để đọc tin nhắn
//       const utterance = new SpeechSynthesisUtterance(lastAIMessage.text);
//       utterance.lang = "vi-VN";
//       window.speechSynthesis.speak(utterance);
//     }
//   };

//   const sendMessage = async () => {
//     const message = userInput.trim();
//     if (!message || isLoading) return;

//     // Thêm tin nhắn người dùng
//     const userMessage = { text: message, type: "user-message" };
//     setMessages((prev) => [...prev, userMessage]);
//     setUserInput("");
//     setIsLoading(true);

//     try {
//       // Địa chỉ webhook của bạn
//       const webhookUrl =
//         "http://localhost:5678/webhook/7d3bc223-c78a-44c6-aa2f-2444c00a3303";

//       const dataToSend = {
//         action: "chat",
//         scenario: "Trò chuyện với người bạn AI thấu cảm",
//         history: [],
//         newMessage: message,
//       };

//       const response = await fetch(webhookUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(dataToSend),
//       });

//       const aiReplyText = await response.text();

//       // Thêm tin nhắn AI
//       const aiMessage = { text: aiReplyText, type: "ai-message" };
//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (error) {
//       // Xử lý lỗi
//       const errorMessage = {
//         text: "Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại.",
//         type: "ai-message",
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//       console.error("Lỗi:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       sendMessage();
//     }
//   };

//   return (
//     <div className="chat-container">
//       {/* Header với các công cụ */}
//       <div className="chat-header">
//         <h4>AI Người Bạn Đồng Hành</h4>
//         <div className="chat-tools">
//           <SpeechToTextButton
//             onTextChange={handleSpeechText}
//             buttonSize="sm"
//             className="me-2"
//           />
//           <button
//             className="btn btn-outline-primary btn-sm"
//             onClick={readAIMessage}
//             title="Đọc tin nhắn AI cuối cùng"
//           >
//             🔊
//           </button>
//         </div>
//       </div>

//       {/* Khung chat */}
//       <div className="chat-box" ref={chatBoxRef}>
//         {messages.map((message, index) => (
//           <div key={index} className={`message ${message.type}`}>
//             <div className="message-content">
//               {message.text}
//               {message.type === "ai-message" && (
//                 <TextReaderTwoButtons
//                   text={message.text}
//                   height={30}
//                   showSetupDefault={false}
//                 />
//               )}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="message loading">AI đang suy nghĩ...</div>
//         )}
//       </div>

//       {/* Input area */}
//       <div className="input-area">
//         <div className="input-wrapper">
//           <input
//             type="text"
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Nhập tin nhắn của bạn hoặc sử dụng nút mic..."
//             disabled={isLoading}
//           />
//           <SpeechToTextButton
//             onTextChange={handleSpeechText}
//             buttonSize="sm"
//             className="mic-button"
//           />
//         </div>
//         <button
//           onClick={sendMessage}
//           disabled={isLoading || !userInput.trim()}
//           className="send-button"
//         >
//           ➤
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AIChat;
import React, { useState, useRef, useEffect } from "react";
import SpeechToTextButton from "../voice/SpeechToText";
import TextReaderTwoButtons from "../voice/TextReaderAdvanced";
import "./AIChat.css";

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Chào bạn, tôi là người bạn AI đây. Bạn có muốn chia sẻ điều gì hôm nay không?",
      type: "ai-message",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Tự động điều chỉnh chiều cao textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [userInput]);

  // Hàm xử lý khi có text từ Speech-to-Text
  const handleSpeechText = (text) => {
    setUserInput((prev) => (prev ? prev + " " + text : text));
  };

  // Hàm đọc tin nhắn AI
  const readAIMessage = () => {
    const lastAIMessage = [...messages]
      .reverse()
      .find((msg) => msg.type === "ai-message");
    if (lastAIMessage) {
      const utterance = new SpeechSynthesisUtterance(lastAIMessage.text);
      utterance.lang = "vi-VN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading) return;

    // Thêm tin nhắn người dùng
    const userMessage = { text: message, type: "user-message" };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Địa chỉ webhook của bạn
      const webhookUrl =
        "http://localhost:5678/webhook/7d3bc223-c78a-44c6-aa2f-2444c00a3303";

      const dataToSend = {
        action: "chat",
        scenario: "Trò chuyện với người bạn AI thấu cảm",
        history: [],
        newMessage: message,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const aiReplyText = await response.text();

      // Thêm tin nhắn AI
      const aiMessage = { text: aiReplyText, type: "ai-message" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Xử lý lỗi
      const errorMessage = {
        text: "Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại.",
        type: "ai-message",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Lỗi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  return (
    <div className="chat-container">
      {/* Header với các công cụ */}
      <div className="chat-header">
        <h4>AI Người Bạn Đồng Hành</h4>
        <div className="chat-tools">
          <SpeechToTextButton
            onTextChange={handleSpeechText}
            buttonSize="sm"
            className="me-2"
          />
          <button
            className="btn btn-outline-light btn-sm"
            onClick={readAIMessage}
            title="Đọc tin nhắn AI cuối cùng"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Khung chat */}
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              {message.type === "ai-message" && (
                <div className="message-actions">
                  <TextReaderTwoButtons
                    text={message.text}
                    height={30}
                    showSetupDefault={false}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            AI đang suy nghĩ...
          </div>
        )}
      </div>

      {/* Input area với textarea */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn hoặc sử dụng nút mic... (Shift + Enter để xuống hàng)"
            disabled={isLoading}
            rows={1}
            className="chat-textarea"
          />
          <SpeechToTextButton
            onTextChange={handleSpeechText}
            buttonSize="sm"
            className="mic-button"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={isLoading || !userInput.trim()}
          className="send-button"
          title="Gửi tin nhắn (Enter)"
        >
          {isLoading ? <div className="spinner"></div> : "➤"}
        </button>
      </div>
    </div>
  );
};

export default AIChat;
