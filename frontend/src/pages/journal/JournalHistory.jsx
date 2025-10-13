// pages/journal/JournalHistory.jsx
import React, { useState, useEffect } from "react";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, Clock, Lock, Unlock, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const JournalHistory = () => {
  const { user } = useAuth();
  const {
    journalHistory,
    fetchJournalHistory,
    loading,
    currentPage,
    totalPages,
  } = useJournal();
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (page = 1) => {
    try {
      await fetchJournalHistory(page);
    } catch (error) {
      console.error("Error loading journal history:", error);
    }
  };

  const truncateContent = (html, maxLength = 150) => {
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
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <button
          key={number}
          className={`btn ${
            number === currentPage ? "btn-primary" : "btn-outline-primary"
          } mx-1`}
          onClick={() => loadHistory(number)}
        >
          {number}
        </button>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <div className="btn-group">
          <button
            className="btn btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() => loadHistory(currentPage - 1)}
          >
            ←
          </button>
          {items}
          <button
            className="btn btn-outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => loadHistory(currentPage + 1)}
          >
            →
          </button>
        </div>
      </div>
    );
  };

  if (loading && journalHistory.length === 0) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Đang tải lịch sử nhật ký...</p>
        </div>
      </div>
    );
  }

  if (journalHistory.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info text-center">
          <FileText size={48} className="mb-3 text-primary" />
          <h3>Chưa có nhật ký nào</h3>
          <p>Hãy bắt đầu ghi nhật ký để lưu lại những khoảnh khắc đáng nhớ</p>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
            onClick={() => navigate("/journal/create")}
          >
            <Plus size={18} />
            Ghi nhật ký đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Lịch sử Nhật ký</h2>
          <p className="text-muted mb-0">
            Xem lại những khoảnh khắc đã qua của bạn
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => navigate("/journal/create")}
        >
          <Plus size={18} />
          Nhật ký mới
        </button>
      </div>

      <div className="row">
        {journalHistory.map((journal) => (
          <div key={journal._id} className="col-lg-6 mb-4">
            <div className="card h-100 journal-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span
                    className={`badge ${
                      journal.isPrivate ? "bg-secondary" : "bg-success"
                    } d-flex align-items-center gap-1`}
                  >
                    {journal.isPrivate ? (
                      <Lock size={12} />
                    ) : (
                      <Unlock size={12} />
                    )}
                    {journal.isPrivate ? "Riêng tư" : "Công khai"}
                  </span>
                  <div className="text-muted small text-end">
                    <div className="d-flex align-items-center gap-1">
                      <Calendar size={12} />
                      {dayjs(journal.date).format("DD/MM/YYYY")}
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={12} />
                      {dayjs(journal.date).format("HH:mm")}
                    </div>
                  </div>
                </div>

                <h5 className="card-title mb-3">{journal.title}</h5>

                <div
                  className="journal-preview mb-3 text-muted"
                  dangerouslySetInnerHTML={{
                    __html: truncateContent(journal.content),
                  }}
                />

                {journal.emotions && journal.emotions.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {journal.emotions.slice(0, 3).map((emotion, index) => {
                        const emotionData = EMOTIONS.find(
                          (e) => e.label === emotion
                        );
                        if (!emotionData) return null;

                        return (
                          <span key={index} className="small">
                            {emotionData.emoji}
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

                {journal.tags && journal.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {journal.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="badge bg-light text-dark border small"
                        >
                          {tag}
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

                {journal.media && journal.media.length > 0 && (
                  <div className="small text-muted mb-3">
                    📎 {journal.media.length} file đính kèm
                  </div>
                )}

                <button
                  className="btn btn-outline-primary btn-sm w-100"
                  onClick={() => navigate("/journal/" + journal._id)}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {renderPagination()}
    </div>
  );
};

const EMOTIONS = [
  { emoji: "😊", label: "happy", name: "Vui vẻ", color: "#fbbf24" },
  { emoji: "😢", label: "sad", name: "Buồn", color: "#60a5fa" },
  { emoji: "😡", label: "angry", name: "Tức giận", color: "#ef4444" },
  { emoji: "😴", label: "tired", name: "Mệt mỏi", color: "#6b7280" },
  { emoji: "😃", label: "excited", name: "Hào hứng", color: "#f59e0b" },
  { emoji: "😰", label: "anxious", name: "Lo lắng", color: "#8b5cf6" },
  { emoji: "😌", label: "peaceful", name: "Bình yên", color: "#10b981" },
  { emoji: "🤔", label: "thoughtful", name: "Suy tư", color: "#6366f1" },
  { emoji: "🎉", label: "celebratory", name: "Ăn mừng", color: "#ec4899" },
  { emoji: "💪", label: "motivated", name: "Động lực", color: "#84cc16" },
];

export default JournalHistory;
