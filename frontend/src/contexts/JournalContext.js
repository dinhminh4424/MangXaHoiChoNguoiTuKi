// contexts/JournalContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { journalService } from "../services/journalService";
import { useAuth } from "./AuthContext";

const JournalContext = createContext();

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournal must be used within a JournalProvider");
  }
  return context;
};

export const JournalProvider = ({ children }) => {
  const { user, updateUserStreaks, showMilestonePopup } = useAuth(); // ✅ Lấy thêm hàm showMilestonePopup
  const [todayJournal, setTodayJournal] = useState(null);
  const [journalHistory, setJournalHistory] = useState([]);
  const [journalUserHistory, setJournalUserHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [historyUserIDLoading, setHistoryUserIDLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [journalDetail, setJournalDetail] = useState(null);

  // 🔹 Helper function để lấy user ID
  const getUserId = useCallback(() => {
    return user?._id || user?.id;
  }, [user]);

  // 🔹 Lấy nhật ký hôm nay
  const fetchTodayJournal = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const result = await journalService.getTodayJournal(userId);

      console.log("vỪA VÔ WEB LÀ CHẠY DO ID USER THAY ĐỔI");
      if (result?.success && result?.data) {
        setTodayJournal(result.data);
      } else {
        setTodayJournal(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn("📝 Chưa có nhật ký hôm nay");
        setTodayJournal(null);
      } else {
        console.error("❌ Lỗi khi lấy nhật ký hôm nay:", err);
        // Giữ nguyên todayJournal cũ nếu có lỗi (trừ 404)
      }
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  // 🔹 Tạo nhật ký mới
  const createJournal = async (journalData) => { // ❌ Bỏ showMilestonePopup khỏi tham số
    const userId = getUserId();
    if (!userId) throw new Error("User not found");

    setLoading(true);
    try {
      const result = await journalService.createJournal({
        ...journalData,
        userId: userId,
      });

      if (result?.success && result?.data?.journal) {
        setTodayJournal(result.data.journal);
        // ✅ Cập nhật journalDetail nếu đang xem cùng journal
        if (journalDetail?._id === result.data.journal._id) {
          setJournalDetail(result.data.journal);
        }
        // ✅ KIỂM TRA VÀ HIỂN THỊ POPUP NẾU CÓ CỘT MỐC
        if (result?.data?.milestone) {
          console.log("🎉 Đạt mốc nhật ký!", result.data.milestone);
          showMilestonePopup(result.data.milestone);
        }

        // ✅ CẬP NHẬT TRẠNG THÁI CHUỖI NGÀY TRONG AUTHCONTEXT
        if (result?.data?.journalStreak !== undefined) {
          console.log("🔄 Updating journal streak in AuthContext:", result.data.journalStreak);
          updateUserStreaks({ journalStreak: result.data.journalStreak });
        }
      }
      return result;
    } catch (err) {
      console.error("❌ Lỗi khi tạo nhật ký:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cập nhật nhật ký
  const updateJournal = async (updateData, journalId = null) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not found");

    const targetJournalId = journalId || todayJournal?._id;
    if (!targetJournalId) throw new Error("Journal ID not found");

    setLoading(true);
    try {
      console.log("🔄 [Context] Starting update journal:", {
        targetJournalId,
        updateData,
      });

      // Chuẩn bị data để gửi lên server
      const dataToSend = {
        title: updateData.title || "",
        content: updateData.content || "",
        emotions: Array.isArray(updateData.emotions) ? updateData.emotions : [],
        tags: Array.isArray(updateData.tags) ? updateData.tags : [],
        isPrivate: Boolean(updateData.isPrivate),
        media: Array.isArray(updateData.media) ? updateData.media : [],
        mediaFiles: Array.isArray(updateData.mediaFiles)
          ? updateData.mediaFiles
          : [],
      };

      console.log("📤 [Context] Data to send:", dataToSend);

      const result = await journalService.updateJournal(
        dataToSend,
        targetJournalId
      );

      if (result?.success && result?.data?.journal) {
        const updatedJournal = result.data.journal;

        console.log("✅ [Context] Update successful, updating state...");

        // Cập nhật state
        if (todayJournal?._id === targetJournalId) {
          setTodayJournal(updatedJournal);
          console.log("🔄 Updated todayJournal");
        }

        if (journalDetail?._id === targetJournalId) {
          setJournalDetail(updatedJournal);
          console.log("🔄 Updated journalDetail");
        }

        setJournalHistory((prev) =>
          prev.map((journal) =>
            journal._id === targetJournalId ? updatedJournal : journal
          )
        );

        console.log("✅ [Context] All states updated successfully");
      } else {
        console.warn("⚠️ [Context] Update response missing data:", result);
      }

      return result;
    } catch (err) {
      console.error("❌ [Context] Error updating journal:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi khi cập nhật nhật ký",
      };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lịch sử nhật ký
  const fetchJournalHistory = async (page = 1) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not found");

    setHistoryLoading(true);
    try {
      const result = await journalService.getJournalHistory(userId, page);

      if (result?.success) {
        setJournalHistory(result.data?.journals || result.data || []);
        setTotalPages(result.data?.totalPages || result.totalPages || 1);
      }
      return result;
    } catch (err) {
      console.error("❌ Lỗi khi lấy lịch sử nhật ký:", err);
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  };

  // 🔹 Chi tiết nhật ký theo id
  const fetchJournalDetail = useCallback(async (journalId) => {
    if (!journalId) throw new Error("Journal ID is required");

    setDetailLoading(true);
    try {
      const result = await journalService.getJournalById(journalId);

      if (result?.data.success && result?.data.data) {
        setJournalDetail(result.data.data);
        return result.data.data;
      } else {
        throw new Error("Journal not found");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết nhật ký:", err);
      setJournalDetail(null);
      throw err;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 🔹 Xóa nhật ký
  const deleteJournal = async (journalId) => {
    if (!journalId) throw new Error("Journal ID is required");

    setDeleteLoading(true);
    try {
      const result = await journalService.deleteJournal(journalId);

      if (result?.success) {
        // ✅ Xóa khỏi các state
        if (todayJournal?._id === journalId) {
          setTodayJournal(null);
        }
        if (journalDetail?._id === journalId) {
          setJournalDetail(null);
        }
        setJournalHistory((prev) =>
          prev.filter((journal) => journal._id !== journalId)
        );
      }
      return result;
    } catch (err) {
      console.error("❌ Lỗi khi xóa nhật ký:", err);
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  // 🔹 Clear journal detail
  const clearJournalDetail = useCallback(() => {
    setJournalDetail(null);
  }, []);

  //  Lịch sử nhật ký của user theo id
  const fetchJournalHistoryUserId = useCallback(async (userId, page = 1) => {
    setHistoryUserIDLoading(true);
    try {
      const result = await journalService.getJournalHistory(userId, page);

      if (result?.success) {
        setJournalUserHistory(result.data?.journals || result.data || []);
        setTotalPages(result.data?.totalPages || result.totalPages || 1);
      } else if (result?.data?.success) {
        setJournalUserHistory(result.data.data || []);
        setTotalPages(result.data.data?.totalPages || 1);
      }
      return result;
    } catch (err) {
      console.error("Error fetchJournalHistoryUserId:", err);
      throw err;
    } finally {
      setHistoryUserIDLoading(false);
    }
  }, []);

  // 🔹 Tự động load khi user đổi
  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchTodayJournal();
    } else {
      setTodayJournal(null);
      setJournalHistory([]);
      setJournalDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ✅ chỉ chạy lại khi user thay đổi

  const value = {
    // State
    todayJournal,
    journalHistory,
    journalDetail,
    loading,
    detailLoading,
    historyLoading,
    totalPages,
    currentPage,
    historyUserIDLoading,
    journalUserHistory,

    // Actions
    createJournal,
    updateJournal,
    deleteJournal,
    fetchTodayJournal,
    fetchJournalHistory,
    fetchJournalDetail,
    clearJournalDetail,
    fetchJournalHistoryUserId,
  };

  return (
    <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
  );
};
