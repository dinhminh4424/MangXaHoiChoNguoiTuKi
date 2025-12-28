// pages/journal/JournalHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Calendar,
  Clock,
  Lock,
  Unlock,
  FileText,
  Plus,
  Heart,
  Tag,
  Paperclip,
  Filter,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { getImagesByCategoryActive } from "../../services/imageService";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./JournalHistory.css";

const JournalHistory = () => {
  const { user } = useAuth();
  const {
    journalHistory,
    fetchJournalHistory,
    currentPage,
    totalPages,
    historyLoading,
    loading,
  } = useJournal();
  const navigate = useNavigate();

  const [imageBanner, setImageBanner] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadHistory();
    loadImagesBanner();
  }, []);

  const loadImagesBanner = useCallback(async () => {
    try {
      const res = await getImagesByCategoryActive("Journal");
      if (res.success) {
        setImageBanner(res.image?.file.path);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadHistory = async (page = 1) => {
    try {
      await fetchJournalHistory(page);
    } catch (error) {
      console.error("Error loading journal history:", error);
    }
  };

  const handleRefresh = () => {
    loadHistory(1);
  };

  const truncateContent = (html, maxLength = 120) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <button
          key={i}
          className={`jh-page-btn ${i === currentPage ? "active" : ""}`}
          onClick={() => loadHistory(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="jh-pagination">
        <button
          className="jh-page-arrow"
          disabled={currentPage === 1}
          onClick={() => loadHistory(currentPage - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        {items}
        <button
          className="jh-page-arrow"
          disabled={currentPage === totalPages}
          onClick={() => loadHistory(currentPage + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const filteredJournals = journalHistory.filter((journal) => {
    if (filter === "public") return !journal.isPrivate;
    if (filter === "private") return journal.isPrivate;
    return true;
  });

  if (loading && journalHistory.length === 0) {
    return (
      <div className="jh-container">
        <div className="jh-loading-container">
          <div className="text-center">
            <div className="jh-loading-spinner"></div>
            <p className="jh-loading-text">Đang tải lịch sử nhật ký...</p>
          </div>
        </div>
      </div>
    );
  }

  if (journalHistory.length === 0) {
    return (
      <div className="jh-container">
        <div className="jh-empty-wrapper">
          <div className="card jh-empty-card border-0">
            <div className="card-body p-5 text-center">
              <div className="jh-empty-icon">
                <FileText size={48} />
              </div>
              <h3 className="jh-empty-title mb-3">Chưa có nhật ký nào</h3>
              <p className="jh-empty-description">
                Hãy bắt đầu ghi nhật ký để lưu lại những khoảnh khắc đáng nhớ
                của bạn
              </p>
              <button
                className="btn jh-empty-btn d-inline-flex align-items-center gap-2"
                onClick={() => navigate("/journal/create")}
              >
                <Plus size={20} />
                Ghi nhật ký đầu tiên
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jh-container">
      {/* Header */}
      <div
        className="jh-header-bg"
        style={{ backgroundImage: `url(${imageBanner})` }}
      >
        <div className="container">
          <div className="row align-items-center py-5 jh-header-content">
            <div className="col-lg-8">
              <h1 className="jh-header-title mb-3">Nhật Ký Của Tôi</h1>
              <p className="jh-header-subtitle text-white mb-4">
                Lưu giữ những khoảnh khắc, cảm xúc và kỷ niệm đáng nhớ
              </p>
              <div className="d-flex flex-wrap gap-4">
                <div className="jh-stat-card p-3">
                  <div className="jh-stat-number">{journalHistory.length}</div>
                  <div className="jh-stat-label text-white-75 small">
                    Bài viết
                  </div>
                </div>
                <div className="jh-stat-card p-3">
                  <div className="jh-stat-number">
                    {journalHistory.filter((j) => !j.isPrivate).length}
                  </div>
                  <div className="jh-stat-label text-white-75 small">
                    Công khai
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="d-flex flex-column gap-3">
                <button
                  className="btn btn-light d-flex align-items-center justify-content-center gap-2"
                  onClick={handleRefresh}
                  disabled={historyLoading}
                >
                  <RefreshCw
                    size={20}
                    className={historyLoading ? "jh-loading-spinner" : ""}
                  />
                  Làm mới
                </button>
                <button
                  className="btn btn-primary text-white d-flex align-items-center justify-content-center gap-2"
                  onClick={() => navigate("/journal/create")}
                >
                  <Plus size={20} />
                  Viết nhật ký mới
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row">
          {/* Filter Sidebar */}
          <div className="col-lg-3 mb-4">
            <div className="card jh-filter-card border-0">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Filter size={20} className="text-primary" />
                  <h5 className="jh-filter-title mb-0">Lọc & Sắp xếp</h5>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Trạng thái</label>
                  <div className="d-flex flex-column gap-2">
                    <button
                      className={`jh-filter-btn btn ${
                        filter === "all" ? "active" : ""
                      }`}
                      onClick={() => setFilter("all")}
                    >
                      Tất cả
                    </button>
                    <button
                      className={`jh-filter-btn btn d-flex align-items-center gap-2 ${
                        filter === "public" ? "active" : ""
                      }`}
                      onClick={() => setFilter("public")}
                    >
                      <Unlock size={16} />
                      Công khai
                    </button>
                    <button
                      className={`jh-filter-btn btn d-flex align-items-center gap-2 ${
                        filter === "private" ? "active" : ""
                      }`}
                      onClick={() => setFilter("private")}
                    >
                      <Lock size={16} />
                      Riêng tư
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journal List */}
          <div className="col-lg-9">
            <div className="row g-4">
              {filteredJournals.map((journal) => (
                <div key={journal._id} className="col-md-6 jh-card-wrapper">
                  <div className="card jh-card border-0 h-100">
                    <div className="card-body d-flex flex-column p-4">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span
                          className={`jh-card-status ${
                            journal.isPrivate ? "private" : "public"
                          }`}
                        >
                          {journal.isPrivate ? (
                            <Lock size={12} />
                          ) : (
                            <Unlock size={12} />
                          )}
                          {journal.isPrivate ? "Riêng tư" : "Công khai"}
                        </span>
                        <div className="jh-card-date text-end">
                          <div className="d-flex align-items-center gap-1">
                            <Calendar size={12} />
                            {dayjs(journal.date).format("DD/MM/YYYY")}
                          </div>
                          <div className="d-flex align-items-center gap-1 mt-1">
                            <Clock size={12} />
                            {dayjs(journal.date).format("HH:mm")}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h5 className="jh-card-title mb-3">{journal.title}</h5>

                      {/* Content */}
                      <div className="jh-card-preview mb-3 flex-grow-1">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: truncateContent(journal.content),
                          }}
                        />
                      </div>

                      {/* Emotions */}
                      {journal.emotions?.length > 0 && (
                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <Heart size={14} className="text-danger" />
                            <small className="text-muted fw-semibold">
                              Cảm xúc
                            </small>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {journal.emotions
                              .slice(0, 3)
                              .map((emotion, index) => {
                                const emotionData = EMOTIONS.find(
                                  (e) => e.label === emotion
                                );
                                if (!emotionData) return null;

                                return (
                                  <span
                                    key={index}
                                    className="jh-emotion-badge"
                                  >
                                    <span>{emotionData.emoji}</span>
                                    <span className="small">
                                      {emotionData.name}
                                    </span>
                                  </span>
                                );
                              })}
                            {journal.emotions.length > 3 && (
                              <span className="small text-muted">
                                +{journal.emotions.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {journal.tags?.length > 0 && (
                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <Tag size={14} className="text-secondary" />
                            <small className="text-muted fw-semibold">
                              Thẻ
                            </small>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {journal.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="jh-tag">
                                #{tag}
                              </span>
                            ))}
                            {journal.tags.length > 3 && (
                              <span className="small text-muted">
                                +{journal.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Media */}
                      {journal.media?.length > 0 && (
                        <div className="mb-3 d-flex align-items-center gap-2">
                          <Paperclip size={14} className="text-muted" />
                          <small className="text-muted">
                            {journal.media.length} file đính kèm
                          </small>
                        </div>
                      )}

                      {/* View Button */}
                      <button
                        className="btn jh-view-btn mt-auto d-flex align-items-center justify-content-center gap-2"
                        onClick={() => navigate("/journal/" + journal._id)}
                      >
                        Xem chi tiết
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
};

const EMOTIONS = [
  { emoji: "😊", label: "happy", name: "Vui vẻ", color: "#f59e0b" },
  { emoji: "😢", label: "sad", name: "Buồn", color: "#60a5fa" },
  { emoji: "😡", label: "angry", name: "Tức giận", color: "#ef4444" },
  { emoji: "😴", label: "tired", name: "Mệt mỏi", color: "#6b7280" },
  { emoji: "😃", label: "excited", name: "Hào hứng", color: "#f97316" },
  { emoji: "😰", label: "anxious", name: "Lo lắng", color: "#8b5cf6" },
  { emoji: "😌", label: "peaceful", name: "Bình yên", color: "#10b981" },
  { emoji: "🤔", label: "thoughtful", name: "Suy tư", color: "#6366f1" },
  { emoji: "🎉", label: "celebratory", name: "Ăn mừng", color: "#ec4899" },
  { emoji: "💪", label: "motivated", name: "Động lực", color: "#84cc16" },
];

export default JournalHistory;
