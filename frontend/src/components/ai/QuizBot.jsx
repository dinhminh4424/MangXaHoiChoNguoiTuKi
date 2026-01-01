// QuizBotEnhanced.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiMessageSquare,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiChevronRight,
  FiStar,
  FiAward,
  FiTrendingUp,
  FiClock,
  FiBookOpen,
  FiUsers,
  FiHeart,
  FiTarget,
  FiBarChart2,
  FiHelpCircle,
  FiSend,
  FiArrowRight,
  FiCornerRightUp,
  FiGlobe,
  FiShield,
  FiThumbsUp,
  FiEdit,
  FiPlus,
  FiHash,
} from "react-icons/fi";
import {
  IoBulbOutline,
  IoTimeOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import {
  BsChatDots,
  BsLightning,
  BsGraphUp,
  BsCheckCircle,
} from "react-icons/bs";
import { FaRobot, FaUser } from "react-icons/fa";
import { AiOutlineAudio, AiOutlinePlayCircle } from "react-icons/ai";

// Import các component cải tiến
import TextReaderTwoButtons from "../voice/TextReaderAdvanced";
import "./QuizBot.css";

import { quizResultService } from "../../services/quizResultService";

const QuizBotEnhanced = () => {
  // State cho các tham số quiz
  const [quizParams, setQuizParams] = useState({
    topic: "Giao tiếp công cộng",
    numberOfQuestions: 3,
    customTopic: "",
    customQuestionCount: "",
  });

  // Thêm state
  const [savingResult, setSavingResult] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State cho giao diện
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [showOptions, setShowOptions] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [hoveredOption, setHoveredOption] = useState(null);
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [useCustomCount, setUseCustomCount] = useState(false);

  const [userSpeechText, setUserSpeechText] = useState("");

  // State cho Text to Speech

  const [ttsText, setTtsText] = useState("");

  // State để theo dõi những phần đang được đọc
  const [currentlyReading, setCurrentlyReading] = useState({
    type: null, // 'question', 'option', 'evaluation'
    id: null,
  });

  // Các chủ đề có sẵn
  const topics = [
    {
      id: "safety",
      name: "An toàn",
      icon: <FiShield color="white" />,
      color: "#4f46e5",
    },
    {
      id: "emotion",
      name: "Cảm xúc",
      icon: <FiHeart color="white" />,
      color: "#ec4899",
    },
    {
      id: "communication",
      name: "Giao tiếp công cộng",
      icon: <FiMessageSquare color="white" />,
      color: "#0ea5e9",
    },
    {
      id: "friendship",
      name: "Kết bạn",
      icon: <FiUsers color="white" />,
      color: "#10b981",
    },
  ];

  // Số lượng câu hỏi có sẵn
  const questionCounts = [3, 5, 7, 10, 15, 20];

  const conversationEndRef = useRef(null);
  const mainContainerRef = useRef(null);

  useEffect(() => {
    // Add initial welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: "ai",
      content:
        "Xin chào! Tôi là Ánh - chuyên gia huấn luyện kỹ năng xã hội và EQ. Tôi rất vui được đồng hành cùng bạn trong hành trình phát triển kỹ năng xã hội!",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: "🌟",
    };
    setConversation([welcomeMessage]);
  }, []);

  // Cuộn xuống cuối cuộc trò chuyện
  useEffect(() => {
    if (conversationEndRef.current) {
      setTimeout(() => {
        conversationEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [conversation]);

  // Xử lý thay đổi tham số
  const handleParamChange = (key, value) => {
    setQuizParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Hàm lưu kết quả

  const saveQuizResult = async () => {
    if (!quizResult || !quizQuestions.length) return;

    try {
      setSavingResult(true);

      // Tạo sessionId duy nhất cho lần làm bài này
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Đảm bảo questions là mảng object đúng định dạng
      const formattedQuestions = quizQuestions.map((q) => ({
        id: q.id,
        type: q.type || "question",
        topic: q.topic || quizParams.topic,
        title: q.title || "",
        question: q.question || "",
        options: q.options || {},
      }));

      // Đảm bảo details có questionId
      const formattedDetails =
        quizResult.details?.map((detail, index) => ({
          questionId: detail.id || detail.questionId || index + 1,
          userChoice: detail.userChoice || "",
          correctAnswer: detail.correctAnswer || "",
          isCorrect: detail.isCorrect || false,
          analysis: detail.analysis || {
            empathy_check: "",
            social_logic: "",
            correction: "",
          },
        })) || [];

      const resultData = {
        sessionId: sessionId, // Thêm sessionId hợp lệ
        topic: quizParams.topic,
        numberOfQuestions: quizParams.numberOfQuestions,
        questions: formattedQuestions,
        userAnswers,
        score: quizResult.score,
        details: formattedDetails,
        overall_review: quizResult.overall_review || {
          strengths: "",
          areas_for_improvement: "",
          actionable_advice: "",
        },
        userId: getUserId(),
        completedAt: new Date().toISOString(),
      };

      console.log("Data to save:", JSON.stringify(resultData, null, 2));

      const response = await quizResultService.saveResult(resultData);

      if (response.success) {
        setSaveSuccess(true);

        // Thêm tin nhắn vào conversation
        const aiMessage = {
          id: Date.now() + 2,
          type: "ai",
          content: `📊 Kết quả đã được lưu vào lịch sử! Bạn có thể xem lại bất cứ lúc nào.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          avatar: <FaRobot />,
        };
        setConversation((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Lỗi khi lưu kết quả:", error);
      setError("Không thể lưu kết quả. Vui lòng thử lại.");
    } finally {
      setSavingResult(false);
    }
  };

  // Tạo userId duy nhất
  const getUserId = () => {
    let userId = localStorage.getItem("quizBotUserId");
    if (!userId) {
      userId =
        "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("quizBotUserId", userId);
    }
    return userId;
  };

  // Gửi tin nhắn đến AI
  const sendMessage = async (message, isStartQuiz = false) => {
    setIsLoading(true);
    setError(null);
    const userId = getUserId();

    try {
      const response = await axios.post(
        "https://j0v0iinh.app.n8n.cloud/webhook/quiz-bot",
        {
          message: message,
          userId: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      return response.data.reply;
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setError("Không thể kết nối với server. Vui lòng thử lại sau.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Parse JSON response từ AI
  const parseQuizResponse = (response) => {
    try {
      console.log("Parsing quiz response:", response);

      let jsonData;
      if (typeof response === "string") {
        const cleanJson = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        jsonData = JSON.parse(cleanJson);
      } else {
        jsonData = response;
      }

      if (!Array.isArray(jsonData)) {
        throw new Error("Invalid response format");
      }

      const questions = jsonData.map((item, index) => ({
        id: item.id || index + 1,
        type: item.type || "question",
        topic: item.topic || quizParams.topic,
        title: item.title || `Tình huống ${index + 1}`,
        question: item.question || "",
        options: item.options || {},
        correctAnswer: null,
      }));

      return questions;
    } catch (error) {
      console.error("Lỗi khi parse quiz response:", error);
      setError("Không thể phân tích câu hỏi. Vui lòng thử lại!");
      return null;
    }
  };

  // Parse evaluation response từ AI
  const parseEvaluationResponse = (response) => {
    try {
      console.log("Parsing evaluation response:", response);

      let jsonData;
      if (typeof response === "string") {
        const cleanJson = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        jsonData = JSON.parse(cleanJson);
      } else {
        jsonData = response;
      }

      if (jsonData.type !== "evaluation") {
        throw new Error("Invalid evaluation format");
      }

      return jsonData;
    } catch (error) {
      console.error("Lỗi khi parse evaluation response:", error);
      setError("Không thể phân tích kết quả. Vui lòng thử lại!");
      return null;
    }
  };

  // Bắt đầu tạo quiz
  const handleStartQuiz = async () => {
    if (isLoading) return;

    // Xác định chủ đề để sử dụng
    const selectedTopic =
      useCustomTopic && quizParams.customTopic.trim()
        ? quizParams.customTopic
        : quizParams.topic;

    // Xác định số lượng câu hỏi
    let selectedCount = quizParams.numberOfQuestions;
    if (useCustomCount && quizParams.customQuestionCount) {
      const customCount = parseInt(quizParams.customQuestionCount);
      if (customCount > 0 && customCount <= 20) {
        // Giới hạn tối đa 20 câu
        selectedCount = customCount;
      } else {
        setError("Số lượng câu hỏi phải từ 1 đến 20");
        return;
      }
    }

    const message = `Tạo ${selectedCount} câu hỏi về chủ đề ${selectedTopic}`;

    // Thêm tin nhắn của người dùng vào conversation
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `Tạo ${selectedCount} câu hỏi về "${selectedTopic}"`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: <FaUser />,
    };

    setConversation((prev) => [...prev, userMessage]);
    setShowOptions(false);
    setQuizStarted(true);
    setQuizQuestions([]);
    setUserAnswers({});
    setActiveTab("quiz");

    // Cập nhật quizParams với giá trị đã chọn
    setQuizParams((prev) => ({
      ...prev,
      topic: selectedTopic,
      numberOfQuestions: selectedCount,
    }));

    // Gửi yêu cầu tạo quiz
    const aiResponse = await sendMessage(message, true);

    if (!aiResponse) {
      return;
    }

    // Parse câu hỏi từ phản hồi AI
    const questions = parseQuizResponse(aiResponse);

    if (questions && questions.length > 0) {
      setQuizQuestions(questions);

      // Khởi tạo đối tượng userAnswers
      const initialAnswers = {};
      questions.forEach((q) => {
        initialAnswers[q.id] = null;
      });
      setUserAnswers(initialAnswers);

      // Thêm tin nhắn AI vào conversation
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: `✅ Đã tạo thành công ${questions.length} câu hỏi về chủ đề "${selectedTopic}". Hãy trả lời các câu hỏi bên dưới!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: <FaRobot />,
      };
      setConversation((prev) => [...prev, aiMessage]);
    }
  };

  // Xử lý chọn đáp án
  const handleAnswerSelect = (questionId, answerLetter) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerLetter,
    }));
  };

  // Nộp bài
  const handleSubmitQuiz = async () => {
    // Kiểm tra xem đã trả lời tất cả câu hỏi chưa
    const unanswered = Object.values(userAnswers).filter(
      (answer) => answer === null
    );

    if (unanswered.length > 0) {
      setError(
        `Vui lòng trả lời tất cả các câu hỏi. Còn ${unanswered.length} câu chưa trả lời.`
      );

      const firstUnanswered = quizQuestions.find(
        (q) => userAnswers[q.id] === null
      );
      if (firstUnanswered) {
        const element = document.getElementById(
          `question-${firstUnanswered.id}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }

      return;
    }

    setError(null);

    // Tạo chuỗi đáp án
    let answerString = "";
    quizQuestions.forEach((question) => {
      answerString += `${question.id}${userAnswers[
        question.id
      ].toUpperCase()} `;
    });
    answerString = answerString.trim();

    // Thêm tin nhắn người dùng vào conversation
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `Đã hoàn thành bài tập và nộp đáp án`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: <FaUser />,
    };

    setConversation((prev) => [...prev, userMessage]);
    setQuizCompleted(true);

    // Gửi đáp án để chấm điểm
    const aiResponse = await sendMessage(answerString, false);

    if (!aiResponse) {
      return;
    }

    // Parse kết quả từ phản hồi AI
    const evaluation = parseEvaluationResponse(aiResponse);

    if (evaluation) {
      setQuizResult(evaluation);
      setActiveTab("results");

      // Thêm tin nhắn AI vào conversation
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: `📊 Đã nhận được kết quả của bạn! Hãy xem phần phân tích chi tiết bên dưới.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: <FaRobot />,
      };
      setConversation((prev) => [...prev, aiMessage]);
    }
  };

  // Bắt đầu quiz mới
  const handleNewQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizResult(null);
    setError(null);
    setShowOptions(true);
    setActiveTab("create");
    setUseCustomTopic(false);
    setUseCustomCount(false);

    // Reset về giá trị mặc định nhưng giữ custom input nếu có
    setQuizParams((prev) => ({
      ...prev,
      topic: "Giao tiếp công cộng",
      numberOfQuestions: 3,
    }));

    const newQuizMessage = {
      id: Date.now(),
      type: "ai",
      content:
        "Sẵn sàng cho bài tập mới nào! Hãy chọn chủ đề và số lượng câu hỏi bạn muốn thực hành.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: <FaRobot />,
    };
    setConversation((prev) => [...prev, newQuizMessage]);
  };

  // Format điểm số
  const formatScore = (scoreString) => {
    if (!scoreString) return "0/0";
    return scoreString;
  };

  // Tính phần trăm đúng
  const calculateScorePercentage = (scoreString) => {
    const match = scoreString.match(/(\d+)\/(\d+)/);
    if (match) {
      const correct = parseInt(match[1]);
      const total = parseInt(match[2]);
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    }
    return 0;
  };

  // Lấy icon cho chủ đề
  const getTopicIcon = (topicName) => {
    const topic = topics.find((t) => t.name === topicName);
    return topic ? topic.icon : <FiMessageSquare />;
  };

  // Hàm đọc câu hỏi
  const readQuestion = (question) => {
    const text = `Câu ${question.id}: ${question.title || ""}. ${
      question.question
    }`;
    setCurrentlyReading({ type: "question", id: question.id });
    // Gọi TextReaderTwoButtons để đọc
    handleReadText(text);
  };

  // Hàm đọc đáp án
  const readOption = (question, letter, text) => {
    const fullText = `Đáp án ${letter}: ${text}`;
    setCurrentlyReading({ type: "option", id: `${question.id}-${letter}` });
    handleReadText(fullText);
  };

  // Hàm đọc phần đánh giá
  const readEvaluation = (detail) => {
    const text = `
      Câu ${detail.id}. 
      Bạn đã chọn: ${detail.userChoice}.
      Đáp án đúng là: ${detail.correctAnswer}.
      ${
        detail.isCorrect
          ? "Chúc mừng bạn đã trả lời đúng!"
          : "Bạn đã trả lời sai."
      }
      ${
        detail.analysis
          ? `
        Phân tích: 
        Thấu hiểu: ${detail.analysis.empathy_check}.
        Logic xã hội: ${detail.analysis.social_logic}.
        Giải pháp: ${detail.analysis.correction}.
      `
          : ""
      }
    `;
    setCurrentlyReading({ type: "evaluation", id: detail.id });
    handleReadText(text);
  };

  // Hàm đọc tổng quan đánh giá
  const readOverallReview = () => {
    if (!quizResult?.overall_review) return;

    const text = `
      Đánh giá tổng quan: 
      Điểm mạnh: ${quizResult.overall_review.strengths}.
      Cần cải thiện: ${quizResult.overall_review.areas_for_improvement}.
      Lời khuyên: ${quizResult.overall_review.actionable_advice}.
    `;
    setCurrentlyReading({ type: "overall", id: "overall" });
    handleReadText(text);
  };

  // Xử lý nhận diện giọng nói
  const handleSpeechResult = (text) => {
    setUserSpeechText(text);
    // Có thể tự động gửi tin nhắn hoặc xử lý khác
  };

  // Xử lý đọc văn bản
  const handleReadText = (text) => {
    setTtsText(text);
    // Kích hoạt TTS - ở đây chúng ta sẽ giả sử TextReaderTwoButtons xử lý việc đọc
  };

  // Kiểm tra xem phần tử có đang được đọc không
  const isCurrentlyReading = (type, id) => {
    return currentlyReading.type === type && currentlyReading.id === id;
  };

  // Hiển thị đánh giá chi tiết
  const renderDetailedEvaluation = () => {
    if (!quizResult || !quizResult.details) return null;

    return quizResult.details.map((detail, index) => (
      <div key={index} className="quizbot-evaluation-card">
        <div className="quizbot-evaluation-header">
          <div className="quizbot-question-number">
            <span className="quizbot-number-badge">Câu {detail.id}</span>
          </div>
          <div className="quizbot-evaluation-actions">
            <TextReaderTwoButtons
              text={`
                Câu ${detail.id}. 
                Bạn đã chọn: ${detail.userChoice}.
                Đáp án đúng là: ${detail.correctAnswer}.
                ${
                  detail.isCorrect
                    ? "Chúc mừng bạn đã trả lời đúng!"
                    : "Bạn đã trả lời sai."
                }
                ${
                  detail.analysis
                    ? `
                  Phân tích: 
                  Thấu hiểu: ${detail.analysis.empathy_check}.
                  Logic xã hội: ${detail.analysis.social_logic}.
                  Giải pháp: ${detail.analysis.correction}.
                `
                    : ""
                }
              `}
              lang="vi-VN"
              rate={0.95}
              pitch={1.0}
              volume={1.0}
              height={32}
              minWidth={36}
              className={`quizbot-read-evaluation-btn ${
                isCurrentlyReading("evaluation", detail.id)
                  ? "quizbot-reading"
                  : ""
              }`}
            />
          </div>
          <div
            className={`quizbot-status-indicator ${
              detail.isCorrect ? "quizbot-correct" : "quizbot-incorrect"
            }`}
          >
            {detail.isCorrect ? (
              <>
                <BsCheckCircle className="quizbot-status-icon" />
                <span>Đúng</span>
              </>
            ) : (
              <>
                <FiX className="quizbot-status-icon" />
                <span>Sai</span>
              </>
            )}
          </div>
        </div>

        <div className="quizbot-answer-comparison">
          <div className="quizbot-comparison-item">
            <span className="quizbot-comparison-label">Bạn chọn:</span>
            <span
              className={`quizbot-choice-badge ${
                detail.isCorrect ? "quizbot-correct" : "quizbot-incorrect"
              }`}
            >
              {detail.userChoice}
            </span>
          </div>
          <FiArrowRight className="quizbot-comparison-arrow" />
          <div className="quizbot-comparison-item">
            <span className="quizbot-comparison-label">Đáp án:</span>
            <span className="quizbot-choice-badge quizbot-correct">
              {detail.correctAnswer}
            </span>
          </div>
        </div>

        {detail.analysis && (
          <div className="quizbot-analysis-grid">
            <div className="quizbot-analysis-card quizbot-empathy">
              <div className="quizbot-analysis-icon">
                <FiHeart />
              </div>
              <div className="quizbot-analysis-content">
                <h4>Thấu hiểu</h4>
                <p>{detail.analysis.empathy_check}</p>
              </div>
            </div>

            <div className="quizbot-analysis-card quizbot-logic">
              <div className="quizbot-analysis-icon">
                <IoBulbOutline />
              </div>
              <div className="quizbot-analysis-content">
                <h4>Logic xã hội</h4>
                <p>{detail.analysis.social_logic}</p>
              </div>
            </div>

            <div className="quizbot-analysis-card quizbot-solution">
              <div className="quizbot-analysis-icon">
                <FiTarget />
              </div>
              <div className="quizbot-analysis-content">
                <h4>Giải pháp</h4>
                <p>{detail.analysis.correction}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="quizbot-enhanced-container" ref={mainContainerRef}>
      {/* Floating Background Elements */}
      <div className="quizbot-background-elements">
        <div className="quizbot-bg-circle quizbot-circle-1"></div>
        <div className="quizbot-bg-circle quizbot-circle-2"></div>
        <div className="quizbot-bg-circle quizbot-circle-3"></div>
        <div className="quizbot-bg-blur"></div>
      </div>

      {/* Header */}
      <header className="quizbot-enhanced-header">
        <div className="quizbot-header-wrapper">
          <div className="quizbot-logo-section">
            <div className="quizbot-logo-icon">
              <IoSparklesOutline />
            </div>
            <div className="quizbot-logo-text">
              <h1>
                Social Skills <span className="quizbot-highlight">Coach</span>
              </h1>
              <p className="quizbot-tagline">
                Đồng hành cùng bạn phát triển kỹ năng xã hội
              </p>
            </div>
          </div>

          <div className="quizbot-header-actions">
            <div className="quizbot-user-stats">
              {/* Lịch sử làm quiz */}
              <a className="quizbot-stat-item" href="/quiz-history">
                <FiTrendingUp className="quizbot-stat-icon" />
                <div className="quizbot-stat-info">
                  <span className="quizbot-stat-label">Lịch sử</span>
                </div>
              </a>

              {/* Số câu hỏi */}
              <div className="quizbot-stat-item">
                <FiHelpCircle className="quizbot-stat-icon" />
                <div className="quizbot-stat-info">
                  <span className="quizbot-stat-value">
                    {quizQuestions.length}
                  </span>
                  <span className="quizbot-stat-label">Câu hỏi</span>
                </div>
              </div>

              {/* Điểm số */}
              {quizResult && (
                <div className="quizbot-stat-item">
                  <FiAward className="quizbot-stat-icon" />
                  <div className="quizbot-stat-info">
                    <span className="quizbot-stat-value">
                      {formatScore(quizResult.score).split("/")[0]}
                    </span>
                    <span className="quizbot-stat-label">Điểm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="quizbot-enhanced-main">
        <div className="quizbot-main-wrapper">
          {/* Left Panel - Chat & Quiz */}
          <div className="quizbot-left-panel">
            {/* Navigation Tabs */}
            <div className="quizbot-navigation-tabs">
              <button
                className={`quizbot-tab-btn ${
                  activeTab === "create" ? "quizbot-active" : ""
                }`}
                onClick={() => setActiveTab("create")}
              >
                <FiBookOpen className="quizbot-tab-icon" />
                <span>Tạo bài tập</span>
              </button>
              {quizStarted && !quizCompleted && (
                <button
                  className={`quizbot-tab-btn ${
                    activeTab === "quiz" ? "quizbot-active" : ""
                  }`}
                  onClick={() => setActiveTab("quiz")}
                >
                  <FiTarget className="quizbot-tab-icon" />
                  <span>Làm bài tập</span>
                  <span className="quizbot-tab-badge">
                    {quizQuestions.length}
                  </span>
                </button>
              )}
              {quizCompleted && (
                <button
                  className={`quizbot-tab-btn ${
                    activeTab === "results" ? "quizbot-active" : ""
                  }`}
                  onClick={() => setActiveTab("results")}
                >
                  <FiBarChart2 className="quizbot-tab-icon" />
                  <span>Kết quả</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="quizbot-content-area">
              {/* Error Message */}
              {error && (
                <div className="quizbot-error-alert">
                  <FiX className="quizbot-error-icon" />
                  <span>{error}</span>
                  <button
                    className="quizbot-error-close"
                    onClick={() => setError(null)}
                  >
                    <FiX />
                  </button>
                </div>
              )}

              {/* Create Quiz Section */}
              {activeTab === "create" && !quizStarted && (
                <div className="quizbot-create-quiz-section">
                  <div className="quizbot-section-header">
                    <h2>
                      <FiBookOpen /> Tạo Bài Tập Mới
                    </h2>
                    <p className="quizbot-section-subtitle">
                      Tùy chỉnh bài tập theo nhu cầu của bạn
                    </p>
                  </div>

                  <div className="quizbot-quiz-config">
                    {/* Topic Selection */}
                    <div className="quizbot-config-section">
                      <label className="quizbot-config-label">
                        <FiMessageSquare className="quizbot-label-icon" />
                        Chọn chủ đề luyện tập
                      </label>

                      {/* Tùy chọn chủ đề tùy chỉnh */}
                      <div className="quizbot-custom-topic-toggle">
                        <button
                          className={`quizbot-toggle-btn ${
                            useCustomTopic ? "quizbot-toggle-active" : ""
                          }`}
                          onClick={() => setUseCustomTopic(!useCustomTopic)}
                        >
                          <FiEdit />
                          <span>
                            {useCustomTopic
                              ? "Chọn từ danh sách"
                              : "Nhập chủ đề tùy chỉnh"}
                          </span>
                        </button>
                      </div>

                      {useCustomTopic ? (
                        <div className="quizbot-custom-input-section">
                          <div className="quizbot-input-with-icon">
                            <FiEdit className="quizbot-input-icon" />
                            <input
                              type="text"
                              value={quizParams.customTopic}
                              onChange={(e) =>
                                handleParamChange("customTopic", e.target.value)
                              }
                              placeholder="Nhập chủ đề bạn muốn (ví dụ: Kỹ năng thuyết trình, Quản lý xung đột...)"
                              className="quizbot-custom-input"
                              maxLength={100}
                            />
                            {quizParams.customTopic && (
                              <button
                                className="quizbot-input-clear"
                                onClick={() =>
                                  handleParamChange("customTopic", "")
                                }
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                          <p className="quizbot-input-hint">
                            Nhập bất kỳ chủ đề kỹ năng xã hội nào bạn quan tâm
                          </p>
                        </div>
                      ) : (
                        <div className="quizbot-topics-grid">
                          {topics.map((topic) => (
                            <div
                              key={topic.id}
                              className={`quizbot-topic-card ${
                                quizParams.topic === topic.name
                                  ? "quizbot-selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleParamChange("topic", topic.name)
                              }
                              style={{ "--quizbot-topic-color": topic.color }}
                            >
                              <div className="quizbot-topic-icon-wrapper">
                                {topic.icon}
                              </div>
                              <span className="quizbot-topic-name">
                                {topic.name}
                              </span>
                              {quizParams.topic === topic.name && (
                                <div className="quizbot-selected-indicator">
                                  <FiCheck />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Question Count */}
                    <div className="quizbot-config-section">
                      <label className="quizbot-config-label">
                        <FiClock className="quizbot-label-icon" />
                        Số lượng câu hỏi
                      </label>

                      {/* Tùy chọn số lượng tùy chỉnh */}
                      <div className="quizbot-custom-count-toggle">
                        <button
                          className={`quizbot-toggle-btn ${
                            useCustomCount ? "quizbot-toggle-active" : ""
                          }`}
                          onClick={() => setUseCustomCount(!useCustomCount)}
                        >
                          <FiHash />
                          <span>
                            {useCustomCount
                              ? "Chọn từ danh sách"
                              : "Nhập số lượng tùy chỉnh"}
                          </span>
                        </button>
                      </div>

                      {useCustomCount ? (
                        <div className="quizbot-custom-input-section">
                          <div className="quizbot-input-with-icon">
                            <FiHash className="quizbot-input-icon" />
                            <input
                              type="number"
                              value={quizParams.customQuestionCount}
                              onChange={(e) =>
                                handleParamChange(
                                  "customQuestionCount",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập số câu hỏi (1-20)"
                              className="quizbot-custom-input"
                              min="1"
                              max="20"
                            />
                            {quizParams.customQuestionCount && (
                              <button
                                className="quizbot-input-clear"
                                onClick={() =>
                                  handleParamChange("customQuestionCount", "")
                                }
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                          <p className="quizbot-input-hint">
                            Nhập số lượng câu hỏi bạn muốn (tối đa 20 câu)
                          </p>
                        </div>
                      ) : (
                        <div className="quizbot-count-selector">
                          {questionCounts.map((count) => (
                            <button
                              key={count}
                              className={`quizbot-count-btn ${
                                quizParams.numberOfQuestions === count
                                  ? "quizbot-selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleParamChange("numberOfQuestions", count)
                              }
                            >
                              {count} câu
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Start */}
                    <div className="quizbot-quick-start-section">
                      <h4>
                        <BsLightning /> Bắt đầu nhanh
                      </h4>
                      <div className="quizbot-quick-options">
                        <button
                          className="quizbot-quick-option"
                          onClick={() => {
                            setUseCustomTopic(false);
                            setUseCustomCount(false);
                            handleParamChange("topic", "Giao tiếp công cộng");
                            handleParamChange("numberOfQuestions", 3);
                            handleStartQuiz();
                          }}
                        >
                          <div className="quizbot-quick-icon">
                            <FiMessageSquare />
                          </div>
                          <div className="quizbot-quick-info">
                            <span className="quizbot-quick-title">
                              Giao tiếp cơ bản
                            </span>
                            <span className="quizbot-quick-desc">
                              3 câu hỏi
                            </span>
                          </div>
                          <FiChevronRight className="quizbot-quick-arrow" />
                        </button>

                        <button
                          className="quizbot-quick-option"
                          onClick={() => {
                            setUseCustomTopic(false);
                            setUseCustomCount(false);
                            handleParamChange("topic", "Cảm xúc");
                            handleParamChange("numberOfQuestions", 2);
                            handleStartQuiz();
                          }}
                        >
                          <div className="quizbot-quick-icon">
                            <FiHeart />
                          </div>
                          <div className="quizbot-quick-info">
                            <span className="quizbot-quick-title">
                              Quản lý cảm xúc
                            </span>
                            <span className="quizbot-quick-desc">
                              2 câu hỏi
                            </span>
                          </div>
                          <FiChevronRight className="quizbot-quick-arrow" />
                        </button>

                        <button
                          className="quizbot-quick-option"
                          onClick={() => {
                            setUseCustomTopic(false);
                            setUseCustomCount(false);
                            handleParamChange("topic", "Kết bạn");
                            handleParamChange("numberOfQuestions", 4);
                            handleStartQuiz();
                          }}
                        >
                          <div className="quizbot-quick-icon">
                            <FiUsers />
                          </div>
                          <div className="quizbot-quick-info">
                            <span className="quizbot-quick-title">
                              Kết nối xã hội
                            </span>
                            <span className="quizbot-quick-desc">
                              4 câu hỏi
                            </span>
                          </div>
                          <FiChevronRight className="quizbot-quick-arrow" />
                        </button>
                      </div>
                    </div>

                    {/* Start Button */}
                    <button
                      className="quizbot-start-button"
                      onClick={handleStartQuiz}
                      disabled={
                        isLoading ||
                        (useCustomTopic && !quizParams.customTopic.trim()) ||
                        (useCustomCount &&
                          (!quizParams.customQuestionCount ||
                            parseInt(quizParams.customQuestionCount) < 1))
                      }
                    >
                      {isLoading ? (
                        <>
                          <div className="quizbot-loading-spinner"></div>
                          Đang tạo bài tập...
                        </>
                      ) : (
                        <>
                          <AiOutlinePlayCircle className="quizbot-start-icon" />
                          {useCustomTopic && quizParams.customTopic.trim()
                            ? `Bắt đầu: ${quizParams.customTopic}`
                            : "Bắt đầu luyện tập"}
                        </>
                      )}
                    </button>

                    {/* Hiển thị tóm tắt cấu hình */}
                    <div className="quizbot-config-summary">
                      <div className="quizbot-summary-item">
                        <FiMessageSquare />
                        <span>
                          <strong>Chủ đề:</strong>{" "}
                          {useCustomTopic && quizParams.customTopic.trim()
                            ? quizParams.customTopic
                            : quizParams.topic}
                        </span>
                      </div>
                      <div className="quizbot-summary-item">
                        <FiHash />
                        <span>
                          <strong>Số câu hỏi:</strong>{" "}
                          {useCustomCount && quizParams.customQuestionCount
                            ? quizParams.customQuestionCount
                            : quizParams.numberOfQuestions}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Section */}
              {activeTab === "quiz" && quizQuestions.length > 0 && (
                <div className="quizbot-quiz-section">
                  <div className="quizbot-quiz-header">
                    <div className="quizbot-quiz-info">
                      <h2>
                        {getTopicIcon(quizParams.topic)}
                        {quizParams.topic}
                      </h2>
                      <div className="quizbot-quiz-stats">
                        <div className="quizbot-stat-chip">
                          <FiClock />
                          <span>{quizQuestions.length} câu hỏi</span>
                        </div>
                        <div className="quizbot-stat-chip">
                          <BsGraphUp />
                          <span>Không giới hạn thời gian</span>
                        </div>
                      </div>
                    </div>

                    <div className="quizbot-progress-container">
                      <div className="quizbot-progress-info">
                        <span className="quizbot-progress-text">
                          Tiến độ:{" "}
                          {
                            Object.values(userAnswers).filter((a) => a !== null)
                              .length
                          }
                          /{quizQuestions.length}
                        </span>
                        <div className="quizbot-progress-bar">
                          <div
                            className="quizbot-progress-fill"
                            style={{
                              width: `${
                                (Object.values(userAnswers).filter(
                                  (a) => a !== null
                                ).length /
                                  quizQuestions.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="quizbot-questions-list">
                    {quizQuestions.map((question) => (
                      <div
                        key={question.id}
                        id={`question-${question.id}`}
                        className={`quizbot-question-item ${
                          userAnswers[question.id] ? "quizbot-answered" : ""
                        }`}
                      >
                        <div className="quizbot-question-header">
                          <div className="quizbot-question-meta">
                            <span className="quizbot-question-number">
                              Câu {question.id}
                            </span>

                            <div className="quizbot-question-status">
                              {userAnswers[question.id] ? (
                                <span className="quizbot-status quizbot-answered">
                                  <FiCheck /> Đã trả lời
                                </span>
                              ) : (
                                <span className="quizbot-status quizbot-pending">
                                  <FiClock /> Chưa trả lời
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="quizbot-question-content">
                          {question.title && (
                            <div className="quizbot-scenario-box">
                              <div className="quizbot-scenario-header">
                                <FiHelpCircle />
                                <h4>Tình huống</h4>
                              </div>
                              <p className="quizbot-scenario-text">
                                {question.title}
                              </p>
                            </div>
                          )}

                          <div className="quizbot-question-box">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <p className="quizbot-question-text">
                                {question.question}
                              </p>
                              <div className="quizbot-question-actions-header">
                                <TextReaderTwoButtons
                                  text={`Câu ${question.id}: ${
                                    question.title || ""
                                  }. ${question.question}`}
                                  lang="vi-VN"
                                  rate={0.95}
                                  pitch={1.0}
                                  volume={1.0}
                                  height={32}
                                  minWidth={36}
                                  className={`quizbot-read-question-btn ${
                                    isCurrentlyReading("question", question.id)
                                      ? "quizbot-reading"
                                      : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="quizbot-options-grid">
                            {Object.entries(question.options).map(
                              ([letter, text]) => (
                                <div
                                  key={letter}
                                  className={`quizbot-option-item ${
                                    userAnswers[question.id] === letter
                                      ? "quizbot-selected"
                                      : ""
                                  } ${
                                    hoveredOption === `${question.id}-${letter}`
                                      ? "quizbot-hovered"
                                      : ""
                                  } ${
                                    isCurrentlyReading(
                                      "option",
                                      `${question.id}-${letter}`
                                    )
                                      ? "quizbot-reading-option"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleAnswerSelect(question.id, letter)
                                  }
                                  onMouseEnter={() =>
                                    setHoveredOption(`${question.id}-${letter}`)
                                  }
                                  onMouseLeave={() => setHoveredOption(null)}
                                >
                                  <div className="quizbot-option-selector">
                                    <div
                                      className={`quizbot-option-circle ${
                                        userAnswers[question.id] === letter
                                          ? "quizbot-selected"
                                          : ""
                                      }`}
                                    >
                                      {letter}
                                    </div>
                                  </div>
                                  <div className="quizbot-option-content">
                                    <p>{text}</p>
                                  </div>
                                  <div className="quizbot-option-actions">
                                    <TextReaderTwoButtons
                                      text={`Đáp án ${letter}: ${text}`}
                                      lang="vi-VN"
                                      rate={0.95}
                                      pitch={1.0}
                                      volume={1.0}
                                      height={28}
                                      minWidth={32}
                                      className="quizbot-read-option-btn"
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="quizbot-quiz-actions">
                    <button
                      className="quizbot-submit-button quizbot-primary"
                      onClick={handleSubmitQuiz}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="quizbot-loading-spinner quizbot-small"></div>
                          Đang chấm điểm...
                        </>
                      ) : (
                        <>
                          <FiSend />
                          Nộp bài và xem kết quả
                        </>
                      )}
                    </button>

                    <button
                      className="quizbot-submit-button quizbot-secondary"
                      onClick={handleNewQuiz}
                    >
                      <FiRefreshCw />
                      Hủy bài tập
                    </button>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {activeTab === "results" && quizResult && (
                <div className="quizbot-results-section">
                  <div className="quizbot-results-header">
                    <h2>
                      <FiBarChart2 /> Kết Quả Bài Tập
                    </h2>

                    <div className="quizbot-score-display">
                      <div className="quizbot-score-card">
                        <div className="quizbot-score-main">
                          <span className="quizbot-score-value">
                            {formatScore(quizResult.score)}
                          </span>
                          <span className="quizbot-score-label">Tổng điểm</span>
                        </div>
                        <div className="quizbot-score-progress">
                          <div className="quizbot-circular-progress">
                            <svg width="100" height="100" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e0e0e0"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeDasharray={`${calculateScorePercentage(
                                  quizResult.score
                                )}, 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="quizbot-progress-percent">
                              {calculateScorePercentage(quizResult.score)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="quizbot-score-details">
                        <div className="quizbot-detail-item">
                          <div className="quizbot-detail-label">
                            Số câu đúng
                          </div>
                          <div className="quizbot-detail-value quizbot-correct">
                            {formatScore(quizResult.score).split("/")[0]}
                          </div>
                        </div>
                        <div className="quizbot-detail-item">
                          <div className="quizbot-detail-label">
                            Tổng số câu
                          </div>
                          <div className="quizbot-detail-value quizbot-total">
                            {formatScore(quizResult.score).split("/")[1]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/*  Phân tích chi tiết */}
                  <div className="quizbot-evaluation-section">
                    <div className="quizbot-section-header-with-action">
                      <h3>
                        <FiMessageSquare /> Phân tích chi tiết
                      </h3>
                      {quizResult.details && (
                        <button
                          className="quizbot-read-all-btn"
                          onClick={() => {
                            // Đọc tất cả đánh giá
                            const allText = quizResult.details
                              .map(
                                (detail) => `
                              Câu ${detail.id}. 
                              Bạn đã chọn: ${detail.userChoice}.
                              Đáp án đúng là: ${detail.correctAnswer}.
                              ${
                                detail.isCorrect
                                  ? "Chúc mừng bạn đã trả lời đúng!"
                                  : "Bạn đã trả lời sai."
                              }
                            `
                              )
                              .join(" ");
                            handleReadText(allText);
                          }}
                        >
                          <AiOutlineAudio />
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="quizbot-evaluation-list">
                      {renderDetailedEvaluation()}
                    </div>

                    {quizResult.overall_review && (
                      <div className="quizbot-overall-review">
                        <div className="quizbot-review-card">
                          <div className="quizbot-review-header">
                            <FiStar className="quizbot-review-icon" />
                            <h4>Đánh giá tổng quan</h4>
                            <button
                              className="quizbot-read-review-btn"
                              onClick={readOverallReview}
                            >
                              <AiOutlineAudio />
                            </button>
                          </div>

                          <div className="quizbot-review-grid">
                            <div className="quizbot-review-item quizbot-strengths">
                              <div className="quizbot-review-item-header">
                                <FiThumbsUp />
                                <h5>Điểm mạnh</h5>
                              </div>
                              <p>{quizResult.overall_review.strengths}</p>
                            </div>

                            <div className="quizbot-review-item quizbot-improvements">
                              <div className="quizbot-review-item-header">
                                <FiTarget />
                                <h5>Cần cải thiện</h5>
                              </div>
                              <p>
                                {
                                  quizResult.overall_review
                                    .areas_for_improvement
                                }
                              </p>
                            </div>

                            <div className="quizbot-review-item quizbot-advice">
                              <div className="quizbot-review-item-header">
                                <IoBulbOutline />
                                <h5>Lời khuyên</h5>
                              </div>
                              <p>
                                {quizResult.overall_review.actionable_advice}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="quizbot-results-actions">
                    <button
                      className="quizbot-action-button quizbot-primary"
                      onClick={handleNewQuiz}
                    >
                      <FiRefreshCw />
                      Làm bài tập mới
                    </button>

                    <button
                      className="quizbot-action-button quizbot-secondary"
                      onClick={() => setActiveTab("quiz")}
                    >
                      <FiCornerRightUp />
                      Xem lại câu hỏi
                    </button>

                    {!saveSuccess && (
                      <button
                        className="quizbot-action-button quizbot-success"
                        onClick={saveQuizResult}
                        disabled={savingResult}
                      >
                        {savingResult ? (
                          <>
                            <div className="quizbot-loading-spinner quizbot-small"></div>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <FiCheck />
                            Lưu kết quả
                          </>
                        )}
                      </button>
                    )}

                    {saveSuccess && (
                      <div className="quizbot-save-success">
                        <FiCheck /> Đã lưu thành công!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="quizbot-right-panel">
            <div className="quizbot-chat-container">
              <div className="quizbot-chat-header">
                <div className="quizbot-chat-title">
                  <BsChatDots className="quizbot-chat-icon" />
                  <h3>Trò chuyện với Ánh</h3>
                </div>
                <div className="quizbot-chat-stats">
                  <span className="quizbot-message-count">
                    {conversation.length} tin nhắn
                  </span>
                </div>
              </div>

              <div className="quizbot-messages-container">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`quizbot-message ${
                      msg.type === "user" ? "quizbot-user" : "quizbot-ai"
                    }`}
                  >
                    <div className="quizbot-message-avatar">
                      {msg.type === "user" ? <FaUser /> : <FaRobot />}
                    </div>
                    <div className="quizbot-message-content">
                      <div className="quizbot-message-header">
                        <span className="quizbot-message-sender">
                          {msg.type === "user" ? "Bạn" : "Ánh"}
                        </span>
                        <span className="quizbot-message-time">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className="quizbot-message-text">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="quizbot-message quizbot-ai quizbot-typing">
                    <div className="quizbot-message-avatar">
                      <FaRobot />
                    </div>
                    <div className="quizbot-message-content">
                      <div className="quizbot-message-header">
                        <span className="quizbot-message-sender">Ánh</span>
                      </div>
                      <div className="quizbot-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={conversationEndRef} />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="quizbot-stats-panel">
              <div className="quizbot-stats-card">
                <h4>
                  <FiTrendingUp /> Thống kê
                </h4>
                <div className="quizbot-stats-grid">
                  <div className="quizbot-stat-card">
                    <div className="quizbot-stat-icon">
                      <FiBookOpen />
                    </div>
                    <div className="quizbot-stat-info">
                      <span className="quizbot-stat-number">
                        {quizQuestions.length}
                      </span>
                      <span className="quizbot-stat-label">Câu hỏi</span>
                    </div>
                  </div>

                  <div className="quizbot-stat-card">
                    <div className="quizbot-stat-icon">
                      <FiCheck />
                    </div>
                    <div className="quizbot-stat-info">
                      <span className="quizbot-stat-number">
                        {quizResult
                          ? formatScore(quizResult.score).split("/")[0]
                          : "0"}
                      </span>
                      <span className="quizbot-stat-label">Điểm cao</span>
                    </div>
                  </div>

                  <div className="quizbot-stat-card">
                    <div className="quizbot-stat-icon">
                      <IoTimeOutline />
                    </div>
                    <div className="quizbot-stat-info">
                      <span className="quizbot-stat-number">
                        {
                          Object.values(userAnswers).filter((a) => a !== null)
                            .length
                        }
                      </span>
                      <span className="quizbot-stat-label">Đã trả lời</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quizbot-quick-actions-panel">
                <h4>
                  <BsLightning /> Hành động nhanh
                </h4>
                <div className="quizbot-action-buttons">
                  <button
                    className="quizbot-action-btn"
                    onClick={handleNewQuiz}
                  >
                    <FiRefreshCw />
                    <span>Làm mới</span>
                  </button>

                  <button
                    className="quizbot-action-btn"
                    onClick={() => {
                      // Xuất kết quả
                      if (quizResult) {
                        const resultText = `Kết quả bài tập: ${
                          quizResult.score
                        }\n\n${quizResult.overall_review?.strengths || ""}\n\n${
                          quizResult.overall_review?.actionable_advice || ""
                        }`;
                        navigator.clipboard.writeText(resultText);
                        alert("Đã sao chép kết quả!");
                      }
                    }}
                  >
                    <FiSend />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="quizbot-enhanced-footer">
        <div className="quizbot-footer-content">
          <div className="quizbot-footer-info">
            <p className="quizbot-footer-title">Social Skills Coach</p>
            <p className="quizbot-footer-subtitle">
              Đồng hành cùng bạn phát triển kỹ năng xã hội mỗi ngày
            </p>
          </div>

          <div className="quizbot-footer-tech">
            <span className="quizbot-tech-item">
              <FiGlobe />
              Google Gemini AI
            </span>
            <span className="quizbot-tech-item">
              <IoSparklesOutline />
              n8n Workflow
            </span>
            <span className="quizbot-tech-item">
              <BsGraphUp />
              React
            </span>
          </div>
        </div>

        <div className="quizbot-footer-copyright">
          <p>© 2024 Social Skills Coach. Tất cả các quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
};

export default QuizBotEnhanced;
