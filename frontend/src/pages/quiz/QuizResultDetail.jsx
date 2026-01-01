import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizResultService } from "../../services/quizResultService";
import {
  FiArrowLeft,
  FiCheck,
  FiX,
  FiHeart,
  FiTarget,
  FiMessageSquare,
  FiClock,
  FiBookOpen,
  FiThumbsUp,
  FiAlertCircle,
} from "react-icons/fi";
import { IoBulbOutline } from "react-icons/io5";
import TextReaderTwoButtons from "../../components/voice/TextReaderAdvanced";
import "./QuizResultDetail.css";

const QuizResultDetail = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const response = await quizResultService.getResultDetails(resultId);
      if (response.success) {
        setResult(response.data);
      } else {
        setError("Không tìm thấy kết quả");
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết:", error);
      setError("Không thể tải chi tiết kết quả");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="error-container">
        <FiAlertCircle size={48} />
        <h3>{error || "Không tìm thấy kết quả"}</h3>
        <button className="back-btn" onClick={() => navigate("/quiz-history")}>
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="result-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate("/quiz-history")}>
          <FiArrowLeft /> Quay lại
        </button>
        <h1>Chi tiết bài tập</h1>
      </div>

      {/* Thông tin tổng quan */}
      <div className="overview-section">
        <div className="overview-card">
          <div className="overview-info">
            <h2>{result.topic}</h2>
            <div className="overview-meta">
              <div className="meta-item">
                <FiBookOpen />
                <span>{result.numberOfQuestions} câu hỏi</span>
              </div>
              <div className="meta-item">
                <FiClock />
                <span>{formatDate(result.completedAt)}</span>
              </div>
            </div>
          </div>

          <div className="overview-score">
            <div className="score-display">
              <div className="score-main">
                <span className="score-value">{result.score}</span>
                <span className="score-label">Điểm</span>
              </div>
              <div className="score-percentage">
                <div className="percentage-circle">
                  <span>{result.scorePercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Câu hỏi và đáp án */}
      <div className="questions-section">
        <h3>
          <FiMessageSquare /> Câu hỏi và đáp án
        </h3>

        <div className="questions-list">
          {result.questions.map((question) => (
            <div key={question.id} className="question-item">
              <div className="question-header">
                <span className="question-number">Câu {question.id}</span>
                <TextReaderTwoButtons
                  text={`Câu ${question.id}: ${question.title || ""}. ${
                    question.question
                  }`}
                  lang="vi-VN"
                  rate={0.95}
                  pitch={1.0}
                  volume={1.0}
                  height={32}
                  minWidth={36}
                />
              </div>

              {question.title && (
                <div className="scenario">
                  <p>
                    <strong>Tình huống:</strong> {question.title}
                  </p>
                </div>
              )}

              <div className="question-content">
                <p>{question.question}</p>
              </div>

              <div className="options-list">
                {Object.entries(question.options).map(([letter, text]) => (
                  <div
                    key={letter}
                    className={`option-item ${
                      result.userAnswers[question.id] === letter
                        ? "selected"
                        : ""
                    } ${
                      result.details.find((d) => d.questionId === question.id)
                        ?.correctAnswer === letter
                        ? "correct"
                        : ""
                    }`}
                  >
                    <div className="option-letter">{letter}</div>
                    <div className="option-text">
                      <p>{text}</p>
                      <TextReaderTwoButtons
                        text={`Đáp án ${letter}: ${text}`}
                        lang="vi-VN"
                        rate={0.95}
                        pitch={1.0}
                        volume={1.0}
                        height={28}
                        minWidth={32}
                        className="option-read-btn"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phân tích chi tiết */}
      <div className="analysis-section">
        <h3>
          <FiTarget /> Phân tích chi tiết
        </h3>

        <div className="analysis-list">
          {result.details.map((detail) => (
            <div key={detail.questionId} className="analysis-item">
              <div className="analysis-header">
                <div className="question-info">
                  <span className="question-num">Câu {detail.questionId}</span>
                  <div
                    className={`status-badge ${
                      detail.isCorrect ? "correct" : "incorrect"
                    }`}
                  >
                    {detail.isCorrect ? (
                      <>
                        <FiCheck /> Đúng
                      </>
                    ) : (
                      <>
                        <FiX /> Sai
                      </>
                    )}
                  </div>
                </div>
                <div className="answer-comparison">
                  <div className="user-choice">
                    <span>Bạn chọn:</span>
                    <span className="choice-badge">{detail.userChoice}</span>
                  </div>
                  <div className="correct-answer">
                    <span>Đáp án:</span>
                    <span className="choice-badge correct">
                      {detail.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>

              {detail.analysis && (
                <div className="analysis-content">
                  <div className="analysis-card">
                    <div className="analysis-icon">
                      <FiHeart />
                    </div>
                    <div>
                      <h4>Thấu hiểu</h4>
                      <p>{detail.analysis.empathy_check}</p>
                    </div>
                  </div>

                  <div className="analysis-card">
                    <div className="analysis-icon">
                      <IoBulbOutline />
                    </div>
                    <div>
                      <h4>Logic xã hội</h4>
                      <p>{detail.analysis.social_logic}</p>
                    </div>
                  </div>

                  <div className="analysis-card">
                    <div className="analysis-icon">
                      <FiTarget />
                    </div>
                    <div>
                      <h4>Giải pháp</h4>
                      <p>{detail.analysis.correction}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Đánh giá tổng quan */}
      {result.overall_review && (
        <div className="overall-review-section">
          <h3>
            <FiThumbsUp /> Đánh giá tổng quan
          </h3>

          <div className="review-grid">
            <div className="review-card strengths">
              <div className="review-header">
                <h4>Điểm mạnh</h4>
              </div>
              <p>{result.overall_review.strengths}</p>
            </div>

            <div className="review-card improvements">
              <div className="review-header">
                <h4>Cần cải thiện</h4>
              </div>
              <p>{result.overall_review.areas_for_improvement}</p>
            </div>

            <div className="review-card advice">
              <div className="review-header">
                <h4>Lời khuyên</h4>
              </div>
              <p>{result.overall_review.actionable_advice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultDetail;
