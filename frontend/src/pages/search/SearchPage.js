import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import debounce from "lodash/debounce";
import EmptyState from "../../components/UI/EmptyState";
import FriendButton from "../../components/friend/FriendButton";
import Post from "../../components/Post/Post";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("people");
  const [results, setResults] = useState({
    people: [],
    posts: [],
    groups: [],
    journals: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy query từ URL khi component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location]);

  // Stable debounced search (create once) to avoid re-creating debounce on every render
  const debouncedRef = React.useRef();
  if (!debouncedRef.current) {
    debouncedRef.current = debounce(async (query) => {
      try {
        setError(null);
        setLoading(true);

        // Diagnostic logs: token + default headers
        try {
          const token = localStorage.getItem("token");
          console.log("[search] token present?", !!token);
          console.log("[search] api.defaults.headers:", api.defaults?.headers);
        } catch (logErr) {
          console.warn("Could not read token for diagnostics", logErr);
        }

        // Use the shared api instance so Authorization header is included
        try {
          console.log("[search] baseURL:", api.defaults?.baseURL || "(none)");
          console.log(
            "[search] calling:",
            `${api.defaults?.baseURL || ""}/api/users?search=${query}`
          );
        } catch (e) {
          // ignore
        }

        const [usersResponse, postsResponse, groupsResponse, journalsResponse] =
          await Promise.all([
            api.get("/api/users", { params: { search: query, limit: 20 } }),
            api.get("/api/posts", {
              params: { search: query, limit: 10, privacy: "public" },
            }),
            api.get("/api/groups", { params: { search: query, limit: 10 } }),
            api.get("/api/journals", {
              params: { search: query, limit: 10, isPrivate: false },
            }),
          ]);

        //   console.log("groupsResponse: ", groupsResponse);

        // setResults({
        //   people: usersResponse.data.data || [],
        //   posts: postsResponse.data.posts || [],
        //   groups: groupsResponse.data.groups || [],
        //   journals: journalsResponse.data.data || [],
        // });

        setResults({
          people: usersResponse.data.data || [],
          posts: postsResponse.data.posts || [],
          groups: groupsResponse.data.groups || [],
          journals: journalsResponse.data.journals || [],
        });
      } catch (error) {
        console.error(
          "Lỗi khi tìm kiếm (primary):",
          error?.response?.data || error.message || error
        );
        // Try public fallback endpoint for any error (useful while debugging routes/auth)
        try {
          console.log(
            "[search] primary request failed, trying public fallback /api/users/public"
          );
          const publicResp = await api.get("/api/users/public", {
            params: { search: query, limit: 20 },
          });
          setResults((prev) => ({
            ...prev,
            people: publicResp.data.data || [],
          }));
          setError(null);
          return;
        } catch (pubErr) {
          console.error(
            "Lỗi khi gọi public fallback:",
            pubErr?.response?.data || pubErr.message || pubErr
          );
          const serverMessage =
            pubErr?.response?.data?.message ||
            pubErr?.response?.data ||
            pubErr.message;
          setError(
            serverMessage ||
              error?.response?.data?.message ||
              error?.response?.data ||
              error.message ||
              "Lỗi khi tìm kiếm. Vui lòng thử lại."
          );
          return;
        }
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedRef.current && debouncedRef.current.cancel)
        debouncedRef.current.cancel();
    };
  }, []);

  const performSearch = (query) => {
    if (query && query.trim()) {
      // Only run the debounced search. Do NOT update the URL here.
      debouncedRef.current(query);
    } else {
      setResults({
        people: [],
        posts: [],
        groups: [],
        journals: [],
      });
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Render kết quả tìm kiếm theo tab
  const renderResults = () => {
    if (!searchQuery) {
      return (
        <EmptyState
          icon={<i className="ri-search-2-line"></i>}
          title="Tìm kiếm"
          message="Nhập từ khóa để bắt đầu tìm kiếm"
        />
      );
    }

    if (loading) {
      return (
        <div className="search-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Đang tìm kiếm...</p>
        </div>
      );
    }

    const currentResults = results[activeTab] || [];
    if (currentResults.length === 0) {
      return (
        <EmptyState
          icon={<i className="ri-error-warning-line"></i>}
          title="Không tìm thấy kết quả"
          message={`Không tìm thấy kết quả nào cho "${searchQuery}"`}
        >
          <small className="text-muted">Hãy thử với từ khóa khác</small>
        </EmptyState>
      );
    }

    return (
      <div className="search-results-list">
        {currentResults.map((item) => {
          switch (activeTab) {
            case "people":
              return (
                <div key={item._id} className="search-result-item">
                  <div
                    className="d-flex align-items-center flex-grow-1"
                    onClick={() => navigate(`/profile/${item._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={item.profile?.avatar || "/assets/images/user/1.jpg"}
                      className="rounded-circle"
                      alt={item.username}
                      width="40"
                      height="40"
                    />
                    <div className="ms-3">
                      <h6 className="mb-0">{item.fullName}</h6>
                      <small className="text-muted">@{item.username}</small>
                    </div>
                    {item.isOnline && (
                      <span className="badge bg-success ms-auto">Online</span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="ms-2">
                    <FriendButton userId={item._id} />
                  </div>
                </div>
              );

            case "posts":
              return (
                <div key={item._id} className="mb-4">
                  <Post post={item} showActions={true} />
                </div>
              );

            case "groups":
              return (
                <div
                  key={item._id}
                  className="search-result-item"
                  onClick={() => navigate(`/group/${item._id}`)}
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={item.avatar || "/assets/images/group-default.jpg"}
                      className="rounded"
                      alt={item.name}
                      width="50"
                      height="50"
                    />
                    <div className="ms-3">
                      <h6 className="mb-0">{item.name}</h6>
                      <small className="text-muted">
                        {item.memberCount} thành viên
                      </small>
                    </div>
                  </div>
                </div>
              );

            case "journals":
              return (
                <div
                  key={item._id}
                  className="search-result-item"
                  onClick={() => navigate(`/journal/${item._id}`)}
                >
                  <div className="d-flex align-items-center mb-2">
                    <i className="ri-book-line fs-4 me-2"></i>
                    <div>
                      <h6 className="mb-0">{item.title}</h6>
                      <small className="text-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <p className="mb-0 text-truncate">{item.userId?.username}</p>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="search-page">
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar with search filters */}
          <div className="col-md-3">
            <div className="search-sidebar">
              <div className="list-group">
                <button
                  className={`list-group-item list-group-item-action ${
                    activeTab === "people" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("people")}
                >
                  <i className="ri-user-line me-2"></i>
                  Mọi người
                  {results.people.length > 0 && (
                    <span className="badge rounded-pill bg-light text-dark float-end">
                      {results.people.length}
                    </span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action ${
                    activeTab === "posts" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("posts")}
                >
                  <i className="ri-file-list-line me-2"></i>
                  Bài viết
                  {results.posts.length > 0 && (
                    <span className="badge rounded-pill bg-light text-dark float-end">
                      {results.posts.length}
                    </span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action ${
                    activeTab === "groups" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("groups")}
                >
                  <i className="ri-group-line me-2"></i>
                  Nhóm
                  {results.groups.length > 0 && (
                    <span className="badge rounded-pill bg-light text-dark float-end">
                      {results.groups.length}
                    </span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action ${
                    activeTab === "journals" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("journals")}
                >
                  <i className="ri-book-line me-2"></i>
                  Nhật ký
                  {results.journals.length > 0 && (
                    <span className="badge rounded-pill bg-light text-dark float-end">
                      {results.journals.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search results area */}
          <div className="col-md-9">
            <div className="search-results">
              {error && (
                <div className="alert alert-danger m-3" role="alert">
                  {error}
                </div>
              )}
              {renderResults()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
