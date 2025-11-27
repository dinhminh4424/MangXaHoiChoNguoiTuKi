import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import friendService from "../../services/friendService";
import "./profileFriends.css";

const ProfileFriends = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchFriends(1);
    }
  }, [userId]);

  const fetchFriends = async (pageNum = 1) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await friendService.getFriendsByUserId(userId, {
        page: pageNum,
        limit: 20,
      });

      if (pageNum === 1) {
        setFriends(response.data || []);
      } else {
        setFriends((prev) => [...prev, ...(response.data || [])]);
      }

      setPagination(response.pagination);
      setHasMore(pageNum < response.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError("Không thể tải danh sách bạn bè");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFriends(page + 1);
    }
  };

  const getAvatarUrl = (user) => {
    if (user.profile?.avatar) {
      return user.profile.avatar.startsWith("http")
        ? user.profile.avatar
        : `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${
            user.profile.avatar
          }`;
    }
    return "/assets/images/default-avatar.png";
  };

  if (loading && friends.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải danh sách bạn bè...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5 text-danger">
          <i className="fas fa-exclamation-circle fa-2x mb-3"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center text-muted py-5">
          <i className="fas fa-users fa-3x mb-3 text-light"></i>
          <h5>Chưa có bạn bè</h5>
          <p className="mb-0">Kết nối với mọi người để xem danh sách bạn bè</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-0">
            <i className="fas fa-users me-2"></i>
            Bạn bè
            {pagination && (
              <span className="text-muted ms-2">
                ({pagination.totalFriends})
              </span>
            )}
          </h5>
        </div>
      </div> */}
      {!loading && friends.length > 0 && (
        <div className="image-profile-header p-5">
          <div className="header-content">
            <h3>Bạn bè</h3>
            <p>Tất cả Bạn bè</p>

            <span className="image-count-badge">{friends.length} bạn bè</span>
          </div>
        </div>
      )}
      <div className="friends-grid">
        {friends.map((friend) => (
          <Link
            key={friend._id || friend.id}
            to={`/profile/${friend._id || friend.id}`}
            className="friend-card"
          >
            <div className="friend-avatar-wrapper">
              <img
                src={getAvatarUrl(friend)}
                alt={friend.fullName || friend.username}
                className="friend-avatar"
                onError={(e) => {
                  e.target.src = "/assets/images/default-avatar.png";
                }}
              />
              {friend.isOnline && <span className="online-indicator"></span>}
            </div>
            <div className="friend-info">
              <div className="friend-name">
                {friend.fullName || friend.username}
              </div>
              {friend.username && friend.fullName && (
                <div className="friend-username text-muted">
                  @{friend.username}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                Đang tải...
              </>
            ) : (
              "Tải thêm bạn bè"
            )}
          </button>
        </div>
      )}

      {!hasMore && friends.length > 0 && (
        <div className="text-center mt-4">
          <div className="text-muted">
            <p>Đã hiển thị tất cả bạn bè!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileFriends;
