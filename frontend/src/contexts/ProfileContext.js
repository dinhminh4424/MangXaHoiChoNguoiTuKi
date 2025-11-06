import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import userService from "../services/userService";
import { useCallback } from "react";

const ProfileContext = createContext();

export const useProfile = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [viewedUser, setViewedUser] = useState(null); // User đang được xem
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Load user profile khi currentUser thay đổi
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setViewedUser(currentUser);
    }
  }, [currentUser, isAuthenticated]);

  // Xem profile của user khác
  const viewUserProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setError("User ID không hợp lệ");
        return;
      }

      if (userId === currentUser?.id) {
        setViewedUser(currentUser);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const userData = await userService.getUserById(userId);
        setViewedUser(userData);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Không thể tải thông tin người dùng";
        setError(errorMessage);
        console.error("Lỗi khi load user profile:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  // Xem profile của user khác bằng username
  const viewUserProfileByUsername = async (username) => {
    if (username === currentUser?.username) {
      setViewedUser(currentUser);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userData = await userService.getUserByUserName(username);
      setViewedUser(userData);
    } catch (error) {
      setError(error.message);
      console.error("Lỗi khi load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Xem lại profile của chính mình
  const viewMyProfile = () => {
    setViewedUser(currentUser);
    setError("");
  };

  // Cập nhật profile với avatar
  const updateProfileWithAvatar = async (updateData) => {
    setLoading(true);
    setError("");
    setUpdateSuccess(false);

    try {
      const formData = new FormData();

      // Xử lý từng field đúng cách
      Object.keys(updateData).forEach((key) => {
        if (
          key !== "avatar" &&
          updateData[key] !== undefined &&
          updateData[key] !== null &&
          updateData[key] !== ""
        ) {
          if (Array.isArray(updateData[key])) {
            // Với mảng, gửi dạng JSON string để backend dễ xử lý
            updateData[key].forEach((item) => {
              formData.append(key, item);
            });
          } else {
            // Với string, number, boolean
            formData.append(key, updateData[key].toString());
          }
        }
      });

      // Thêm file avatar nếu có
      if (updateData.avatar instanceof File) {
        formData.append("avatar", updateData.avatar);
      }

      // Debug: log FormData contents
      console.log("=== FormData Summary ===");
      const formDataObj = {};
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataObj[
            key
          ] = `File: ${value.name} (${value.type}, ${value.size} bytes)`;
        } else {
          formDataObj[key] = value;
        }
      }
      console.log("FormData contents:", formDataObj);
      console.log("=========================");

      const result = await userService.updateProfileWithAvatar(formData);

      if (result && result.success) {
        setUpdateSuccess(true);

        // Cập nhật viewedUser với data mới
        setViewedUser((prev) => ({
          ...prev,
          fullName: result.data?.fullName || prev.fullName,
          profile: {
            ...prev.profile,
            bio: result.data?.profile?.bio || prev.profile?.bio,
            interests:
              result.data?.profile?.interests || prev.profile?.interests,
            skills: result.data?.profile?.skills || prev.profile?.skills,
            avatar: result.data?.profile?.avatar || prev.profile?.avatar,
          },
        }));

        return { success: true, data: result.data };
      } else {
        throw new Error(result?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi cập nhật";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const reportUser = async (userId, reportData) => {
    try {
      const res = await userService.reportUser(userId, reportData);
      return res;
    } catch (error) {
      console.log("Lỗi khi báo cáo: ", error);
    }
  };

  // Cập nhật profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError("");
    setUpdateSuccess(false);

    try {
      const result = await userService.updateProfile(profileData);
      setUpdateSuccess(true);

      // Cập nhật viewedUser với data mới
      setViewedUser((prev) => ({
        ...prev,
        ...result.data,
        profile: {
          ...prev.profile,
          ...result.data.profile,
        },
      }));

      return { success: true, data: result.data };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateImageCover = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);

      const res = await userService.updateImageCover(formData);
      console.log("res:", res);
      // setViewedUser((prev) => ({
      //   ...prev,
      //   ...res.user,
      //   profile: {
      //     ...prev.profile,
      //     ...res.user.profile,
      //   },
      // }));
      if (res.user && res.success) {
        const url = res.user.profile?.coverPhoto;
        console.log("url:  ", url);
        setViewedUser((prev) => ({
          ...prev,
          profile: {
            ...(prev.profile || {}),
            coverPhoto: url || "/assets/images/default-avatar.png",
          },
        }));
      }

      return res;
    } catch (error) {
      setError("LỖI: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError("");
  };

  // Clear success message
  const clearSuccess = () => {
    setUpdateSuccess(false);
  };

  // Kiểm tra xem có đang xem profile của chính mình không
  const isOwnProfile =
    viewedUser && currentUser && viewedUser.id === currentUser.id;

  const dashboardUserStats = useCallback(async (query) => {
    try {
      setLoading(true);
      setError("");

      const res = await userService.getDashboardUserStats(query);

      if (res?.success) {
        return res;
      } else {
        const message = res?.message || "Lỗi không xác định";
        setError("Lỗi: " + message);
        return {
          success: false,
          message: message,
        };
      }
    } catch (error) {
      const errorMessage = error.message || "Lỗi khi tải thống kê";
      setError("Lỗi: " + errorMessage);
      console.log("Lỗi dashboard:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies để function ổn định

  const value = {
    // State
    viewedUser,
    loading,
    error,
    updateSuccess,

    // Computed
    isOwnProfile,
    isViewingOtherProfile:
      viewedUser && currentUser && viewedUser.id !== currentUser.id,

    // Actions
    viewUserProfile,
    viewMyProfile,
    updateProfile,
    clearError,
    clearSuccess,
    setViewedUser,
    viewUserProfileByUsername,
    updateProfileWithAvatar,
    updateImageCover,
    dashboardUserStats,
    setError,
    reportUser,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
