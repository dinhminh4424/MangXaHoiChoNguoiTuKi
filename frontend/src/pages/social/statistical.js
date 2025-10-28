import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useProfile } from "../../contexts/ProfileContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const UserStatistical = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ period: "7days" });
  const [localError, setLocalError] = useState("");
  const { error, loading, dashboardUserStats } = useProfile();

  // Colors cho biểu đồ
  const CHART_COLORS = {
    primary: "#007bff",
    success: "#28a745",
    info: "#17a2b8",
    warning: "#ffc107",
    danger: "#dc3545",
    purple: "#6f42c1",
    pink: "#e83e8c",
    teal: "#20c997",
  };

  const moodColors = {
    happy: CHART_COLORS.success,
    sad: CHART_COLORS.info,
    angry: CHART_COLORS.danger,
    anxious: CHART_COLORS.warning,
    excited: CHART_COLORS.pink,
    tired: CHART_COLORS.purple,
    neutral: CHART_COLORS.teal,
    default: CHART_COLORS.primary,
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const query = { period: filter.period };
        const res = await dashboardUserStats(query);

        if (res?.success) {
          setStats(res.data);
          setLocalError("");
        } else {
          setLocalError(res?.message || "Lỗi không xác định");
        }
      } catch (error) {
        setLocalError("Lỗi: " + error.message);
      }
    };

    loadData();
  }, [user, dashboardUserStats, filter.period]);

  const handleFilterChange = (newPeriod) => {
    setFilter((prev) => ({ ...prev, period: newPeriod }));
  };

  // Chuẩn bị dữ liệu cho biểu đồ timeline
  const timelineData = useMemo(() => {
    if (!stats?.timelineStats) return [];

    const { posts, journals, comments } = stats.timelineStats;
    const allDates = [
      ...new Set([
        ...posts.map((p) => p._id),
        ...journals.map((j) => j._id),
        ...comments.map((c) => c._id),
      ]),
    ].sort();

    return allDates.map((date) => ({
      date: formatDateLabel(date, filter.period),
      posts: posts.find((p) => p._id === date)?.count || 0,
      journals: journals.find((j) => j._id === date)?.count || 0,
      comments: comments.find((c) => c._id === date)?.count || 0,
      total:
        (posts.find((p) => p._id === date)?.count || 0) +
        (journals.find((j) => j._id === date)?.count || 0) +
        (comments.find((c) => c._id === date)?.count || 0),
    }));
  }, [stats, filter.period]);

  // Dữ liệu cho biểu đồ cảm xúc
  const moodData = useMemo(() => {
    if (!stats?.moodStats) return [];
    return stats.moodStats.map((mood) => ({
      name: mood._id,
      value: mood.count,
      color: moodColors[mood._id?.toLowerCase()] || moodColors.default,
    }));
  }, [stats?.moodStats]);

  // Dữ liệu cho biểu đồ hoạt động hàng ngày
  const dailyActivityData = useMemo(() => {
    if (!timelineData.length) return [];
    return timelineData.map((item) => ({
      date: item.date,
      "Bài viết": item.posts,
      "Nhật ký": item.journals,
      "Bình luận": item.comments,
    }));
  }, [timelineData]);

  // Format date label
  function formatDateLabel(dateString, period) {
    if (period === "all") {
      return dateString; // Format: YYYY-MM
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  // Format số
  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Custom tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-3 border shadow-sm rounded">
          <p className="fw-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const displayError = localError || error;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Thống Kê Cá Nhân</h1>
              <p className="text-muted mb-0">
                Chào mừng, <strong>{user?.username}</strong>! Đây là tổng quan
                hoạt động của bạn.
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-outline-primary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                {filter.period === "7days" && "7 ngày qua"}
                {filter.period === "30days" && "30 ngày qua"}
                {filter.period === "90days" && "90 ngày qua"}
                {filter.period === "all" && "Tất cả thời gian"}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleFilterChange("7days")}
                  >
                    7 ngày qua
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleFilterChange("30days")}
                  >
                    30 ngày qua
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleFilterChange("90days")}
                  >
                    90 ngày qua
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleFilterChange("all")}
                  >
                    Tất cả thời gian
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {displayError && (
        <div className="row mb-4">
          <div className="col-12">
            <div
              className="alert alert-danger d-flex align-items-center"
              role="alert"
            >
              <i className="ri-error-warning-line me-2"></i>
              {displayError}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Đang tải dữ liệu thống kê...</p>
          </div>
        </div>
      ) : (
        stats && (
          <>
            {/* Overview Stats */}
            <div className="row mb-4">
              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-primary text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(stats.overview?.totalPosts || 0)}
                        </h4>
                        <p className="card-text mb-0">Bài viết</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-file-text-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                    <small className="opacity-75">
                      +{stats.weeklyStats?.newPosts || 0} tuần này
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(stats.overview?.totalJournals || 0)}
                        </h4>
                        <p className="card-text mb-0">Nhật ký</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-book-open-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                    <small className="opacity-75">
                      +{stats.weeklyStats?.newJournals || 0} tuần này
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-info text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(stats.overview?.totalComments || 0)}
                        </h4>
                        <p className="card-text mb-0">Bình luận</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-chat-3-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-warning text-dark h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(stats.overview?.totalGroups || 0)}
                        </h4>
                        <p className="card-text mb-0">Nhóm</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-group-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-purple text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(stats.overview?.totalMessages || 0)}
                        </h4>
                        <p className="card-text mb-0">Tin nhắn</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-message-3-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-6 mb-3">
                <div className="card bg-teal text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h4 className="card-title">
                          {formatNumber(
                            moodData.reduce((sum, mood) => sum + mood.value, 0)
                          )}
                        </h4>
                        <p className="card-text mb-0">Cảm xúc</p>
                      </div>
                      <div className="align-self-center">
                        <i className="ri-emotion-line fs-2 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row mb-4">
              {/* Timeline Activity Chart */}
              <div className="col-xl-8 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-bar-chart-line me-2"></i>
                      Hoạt động theo thời gian
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#6c757d" fontSize={12} />
                        <YAxis stroke="#6c757d" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="total"
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.1}
                          stroke={CHART_COLORS.primary}
                          strokeWidth={2}
                          name="Tổng hoạt động"
                        />
                        <Bar
                          dataKey="posts"
                          fill={CHART_COLORS.success}
                          name="Bài viết"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="journals"
                          fill={CHART_COLORS.info}
                          name="Nhật ký"
                          radius={[2, 2, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="comments"
                          stroke={CHART_COLORS.warning}
                          strokeWidth={3}
                          name="Bình luận"
                          dot={{
                            fill: CHART_COLORS.warning,
                            strokeWidth: 2,
                            r: 4,
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Mood Distribution Chart */}
              <div className="col-xl-4 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-emotion-line me-2"></i>
                      Phân bố cảm xúc
                    </h5>
                  </div>
                  <div className="card-body">
                    {moodData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={moodData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(1)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {moodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Số lần"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="ri-emotion-line fs-1 mb-3 d-block"></i>
                        <p>Chưa có dữ liệu cảm xúc</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row mb-4">
              {/* Daily Activity Trend */}
              <div className="col-xl-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-line-chart-line me-2"></i>
                      Xu hướng hoạt động hàng ngày
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dailyActivityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#6c757d" fontSize={11} />
                        <YAxis stroke="#6c757d" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Bài viết"
                          stroke={CHART_COLORS.success}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.success, r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Nhật ký"
                          stroke={CHART_COLORS.info}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.info, r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Bình luận"
                          stroke={CHART_COLORS.warning}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.warning, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Activity Comparison */}
              <div className="col-xl-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-bar-chart-2-line me-2"></i>
                      So sánh hoạt động
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            name: "Bài viết",
                            "Tuần này": stats.weeklyStats?.newPosts || 0,
                            "Tổng cộng": stats.overview?.totalPosts || 0,
                          },
                          {
                            name: "Nhật ký",
                            "Tuần này": stats.weeklyStats?.newJournals || 0,
                            "Tổng cộng": stats.overview?.totalJournals || 0,
                          },
                          {
                            name: "Bình luận",
                            "Tuần này": 0, // Cần backend cung cấp
                            "Tổng cộng": stats.overview?.totalComments || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#6c757d" />
                        <YAxis stroke="#6c757d" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Tuần này"
                          fill={CHART_COLORS.primary}
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="Tổng cộng"
                          fill={CHART_COLORS.info}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-history-line me-2"></i>
                      Hoạt động gần đây
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Loại</th>
                            <th>Nội dung</th>
                            <th>Thời gian</th>
                            <th>Tương tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentActivity?.posts?.map((post) => (
                            <tr key={post._id}>
                              <td>
                                <span className="badge bg-success">
                                  <i className="ri-file-text-line me-1"></i>
                                  Bài viết
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-grow-1">
                                    <p
                                      className="mb-0 text-truncate"
                                      style={{ maxWidth: "200px" }}
                                    >
                                      {post.content?.substring(0, 80)}
                                      {post.content?.length > 80 && "..."}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {new Date(post.createdAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex gap-3">
                                  <small className="text-muted">
                                    <i className="ri-heart-line me-1"></i>
                                    {post.likes?.length || 0}
                                  </small>
                                  <small className="text-muted">
                                    <i className="ri-chat-3-line me-1"></i>
                                    {post.comments?.length || 0}
                                  </small>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}

      <style>{`
        /* Custom styles cho biểu đồ */
.custom-tooltip {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.recharts-default-tooltip {
  border-radius: 0.375rem !important;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

/* Card hover effects */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

/* Custom colors */
.bg-purple {
  background-color: #6f42c1 !important;
}

.bg-teal {
  background-color: #20c997 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
  
  .recharts-wrapper {
    font-size: 12px;
  }
}
      `}</style>
    </div>
  );
};

export default UserStatistical;
