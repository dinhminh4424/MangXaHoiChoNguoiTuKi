// components/profile/ProfileJournal.jsx
import React, { useState, useEffect } from "react";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, Lock, Unlock, Eye, FileText } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const ProfileJournal = ({ userId }) => {
  const {
    journalUserHistory,
    fetchJournalHistoryUserId,
    historyUserIDLoading,
  } = useJournal();

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const id = userId || currentUser?.id;
    if (!id) return;
    fetchJournalHistoryUserId(id, currentPage);
  }, [userId, currentUser?.id, currentPage, fetchJournalHistoryUserId]);

  const handleJournalClick = (journal) => {
    navigate(`/journal/${journal._id}`);
  };

  const formatContent = (content) => {
    // Remove HTML tags and limit length
    const plainText = content.replace(/<[^>]*>/g, "");
    return plainText.length > 150
      ? plainText.substring(0, 150) + "..."
      : plainText;
  };

  const getEmojiForEmotion = (emotion) => {
    const emotionMap = {
      happy: "😊",
      sad: "😢",
      angry: "😡",
      tired: "😴",
      excited: "😃",
      anxious: "😰",
      peaceful: "😌",
      thoughtful: "🤔",
      celebratory: "🎉",
      motivated: "💪",
    };
    return emotionMap[emotion] || "📝";
  };

  if (historyUserIDLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải nhật ký...</p>
        </div>
      </div>
    );
  }

  if (!journalUserHistory || journalUserHistory.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted py-5">
          <FileText size={48} className="mb-3 text-muted" />
          <h5>Chưa có nhật ký nào</h5>
          <p>
            {isOwnProfile
              ? "Hãy bắt đầu viết nhật ký đầu tiên của bạn!"
              : "Người dùng này chưa có nhật ký nào"}
          </p>
          {isOwnProfile && (
            <button
              className="btn btn-primary mt-2"
              onClick={() => navigate("/journal")}
            >
              Viết nhật ký đầu tiên
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!loading && journalUserHistory.length > 0 && (
        <div className="image-profile-header p-5">
          <div className="header-content">
            <h3>Bộ sưu tập nhật kí</h3>
            <p>Tất cả nhật kí</p>

            <span className="image-count-badge">
              {journalUserHistory.length} Nhật kí
            </span>
          </div>
        </div>
      )}

      <div className="row g-3">
        {journalUserHistory.map((journal) => (
          <div key={journal._id} className="col-12">
            <div
              className="card hover-shadow cursor-pointer transition-all"
              onClick={() => handleJournalClick(journal)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="card-title mb-1 text-truncate flex-grow-1">
                    {journal.title}
                  </h6>
                  <div className="d-flex align-items-center gap-2 ms-2">
                    {journal.isPrivate ? (
                      <Lock size={14} className="text-muted" />
                    ) : (
                      <Unlock size={14} className="text-success" />
                    )}
                    {!isOwnProfile && <Eye size={14} className="text-info" />}
                  </div>
                </div>

                <p className="card-text text-muted small mb-3">
                  {formatContent(journal.content)}
                </p>

                {/* Emotions */}
                {journal.emotions && journal.emotions.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {journal.emotions.map((emotion, index) => (
                        <span
                          key={index}
                          className="badge bg-light text-dark border"
                          title={emotion}
                        >
                          {getEmojiForEmotion(emotion)} {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {journal.tags && journal.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {journal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="badge bg-secondary bg-opacity-25 text-dark small"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <Calendar size={14} />
                    <span>
                      {dayjs(journal.date).format("DD/MM/YYYY • HH:mm")}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {journal.media && journal.media.length > 0 && (
                      <span className="badge bg-info bg-opacity-10 text-info small">
                        📎 {journal.media.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - You can add this later */}
      {/* <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">
            <li className="page-item disabled">
              <a className="page-link" href="#">Previous</a>
            </li>
            <li className="page-item active">
              <a className="page-link" href="#">1</a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">Next</a>
            </li>
          </ul>
        </nav>
      </div> */}
    </div>
  );
};

export default ProfileJournal;
