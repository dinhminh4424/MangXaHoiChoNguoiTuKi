import React, { useState, useEffect } from "react";
import { quizResultService } from "../../services/quizResultService";
import {
  FiBarChart2,
  FiClock,
  FiBookOpen,
  FiCheck,
  FiX,
  FiTrash2,
  FiEye,
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiAward,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./QuizHistory.css";

const QuizHistory = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    topic: "all",
    period: "all",
    sortBy: "completedAt",
    sortOrder: "desc",
  });

  useEffect(() => {
    fetchResults();
    fetchStatistics();
  }, [pagination.page, filters]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await quizResultService.getResults({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      setResults(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Lỗi khi lấy danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await quizResultService.getStatistics(filters.period);
      setStats(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
    }
  };

  const handleViewDetails = (resultId) => {
    navigate(`/quiz-result/${resultId}`);
  };

  const handleDelete = async (resultId) => {
    if (window.confirm("Bạn có chắc muốn xóa kết quả này?")) {
      try {
        await quizResultService.deleteResult(resultId);
        fetchResults(); // Refresh list
        fetchStatistics(); // Refresh stats
      } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Không thể xóa kết quả");
      }
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

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="quiz-history-container">
      <header className="quiz-history-header">
        <h1>
          <FiBarChart2 /> Lịch sử bài tập
        </h1>
        <p className="quiz-history-subtitle">
          Xem lại các bài tập đã thực hành và theo dõi tiến trình
        </p>
      </header>

      {/* Thống kê tổng quan */}
      <div className="stats-overview">
        {stats && (
          <>
            <div className="stats-card total-attempts">
              <div className="stats-icon">
                <FiBookOpen />
              </div>
              <div className="stats-content">
                <h3>{stats.overview.totalAttempts}</h3>
                <p>Tổng số bài tập</p>
              </div>
            </div>

            <div className="stats-card average-score">
              <div className="stats-icon">
                <FiTrendingUp />
              </div>
              <div className="stats-content">
                <h3>{Math.round(stats.overview.averageScore)}%</h3>
                <p>Điểm trung bình</p>
              </div>
            </div>

            <div className="stats-card best-score">
              <div className="stats-icon">
                <FiAward />
              </div>
              <div className="stats-content">
                <h3>{stats.overview.bestScore}%</h3>
                <p>Điểm cao nhất</p>
              </div>
            </div>

            <div className="stats-card total-questions">
              <div className="stats-icon">
                <FiCheck />
              </div>
              <div className="stats-content">
                <h3>{stats.overview.totalQuestions}</h3>
                <p>Tổng số câu hỏi</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>
            <FiFilter /> Chủ đề
          </label>
          <select
            value={filters.topic}
            onChange={(e) =>
              setFilters({ ...filters, topic: e.target.value, page: 1 })
            }
          >
            <option value="all">Tất cả chủ đề</option>
            <option value="Giao tiếp công cộng">Giao tiếp công cộng</option>
            <option value="Cảm xúc">Cảm xúc</option>
            <option value="Kết bạn">Kết bạn</option>
            <option value="An toàn">An toàn</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <FiCalendar /> Thời gian
          </label>
          <select
            value={filters.period}
            onChange={(e) => {
              setFilters({ ...filters, period: e.target.value });
              fetchStatistics();
            }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">1 năm qua</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <FiClock /> Sắp xếp
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value, page: 1 })
            }
          >
            <option value="completedAt">Ngày thực hiện</option>
            <option value="scorePercentage">Điểm số</option>
            <option value="topic">Chủ đề</option>
          </select>
        </div>
      </div>

      {/* Danh sách kết quả */}
      <div className="results-list">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <FiBookOpen size={48} />
            <h3>Chưa có bài tập nào</h3>
            <p>Hãy bắt đầu thực hành để xem lịch sử tại đây</p>
            <button
              className="primary-btn"
              onClick={() => navigate("/quiz-bot")}
            >
              Bắt đầu luyện tập
            </button>
          </div>
        ) : (
          <>
            <div className="results-grid">
              {results.map((result) => (
                <div key={result._id} className="result-card">
                  <div className="result-header">
                    <div className="result-topic">
                      <h3>{result.topic}</h3>
                      <span className="question-count">
                        {result.numberOfQuestions} câu
                      </span>
                    </div>
                    <div className="result-score">
                      <div
                        className="score-circle"
                        style={{
                          backgroundColor: getScoreColor(
                            result.scorePercentage
                          ),
                        }}
                      >
                        <span>{result.scorePercentage}%</span>
                      </div>
                      <div className="score-detail">{result.score}</div>
                    </div>
                  </div>

                  <div className="result-info">
                    <div className="info-item">
                      <FiClock />
                      <span>{formatDate(result.completedAt)}</span>
                    </div>
                  </div>

                  <div className="result-actions">
                    <button
                      className="view-btn"
                      onClick={() => handleViewDetails(result._id)}
                    >
                      <FiEye /> Xem chi tiết
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(result._id)}
                    >
                      <FiTrash2 /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  Trước
                </button>

                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPagination({ ...pagination, page: i + 1 })
                    }
                    className={pagination.page === i + 1 ? "active" : ""}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.pages}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;
