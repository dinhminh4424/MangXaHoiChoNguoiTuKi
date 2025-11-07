import React, { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardStats } from "../../services/adminService";
import { updateToken } from "../../services/api";
import "./AdminDashboard.css";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "180d", label: "6 tháng" },
  { value: "365d", label: "12 tháng" },
  { value: "mtd", label: "Tháng này" },
  { value: "ytd", label: "Từ đầu năm" },
  { value: "custom", label: "Tùy chỉnh" },
];

const GROUP_OPTIONS = [
  { value: "day", label: "Theo ngày" },
  { value: "month", label: "Theo tháng" },
  { value: "year", label: "Theo năm" },
];

const AREA_COLORS = {
  users: "#4f46e5",
  posts: "#667eea",
  comments: "#f093fb",
  messages: "#43e97b",
  journals: "#00f2fe",
  likes: "#fa709a",
  interactions: "#ffd166",
  violations: "#ff6b6b",
  moodLogs: "#38bdf8",
};

const PIE_COLORS = [
  "#667eea",
  "#f093fb",
  "#43e97b",
  "#00f2fe",
  "#fa709a",
  "#ffd166",
  "#ff9f1c",
  "#38bdf8",
];

const SUMMARY_ICONS = {
  users: "ri-user-3-line",
  activeUsers: "ri-shield-user-line",
  posts: "ri-article-line",
  comments: "ri-chat-3-line",
  messages: "ri-message-3-line",
  journals: "ri-book-open-line",
  groups: "ri-group-line",
  violations: "ri-error-warning-line",
  moodLogs: "ri-mental-health-line",
  likes: "ri-heart-2-line",
};

const VIOLATION_STATUS_LABELS = {
  pending: "Đang chờ",
  reviewed: "Đã xử lý",
  approved: "Chấp thuận",
  rejected: "Từ chối",
  auto: "Tự động",
  unknown: "Khác",
};

const TARGET_TYPE_LABELS = {
  Post: "Bài viết",
  Comment: "Bình luận",
  User: "Người dùng",
  Message: "Tin nhắn",
  Group: "Nhóm",
  Other: "Khác",
};

const defaultFilters = {
  range: "30d",
  groupBy: "day",
  startDate: "",
  endDate: "",
};

const formatNumber = (value) => {
  if (value === undefined || value === null) return "0";
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString("vi-VN");
};

const formatDateLabel = (value, groupBy) => {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return value;
  switch (groupBy) {
    case "month":
      return date.format("MM/YYYY");
    case "year":
      return date.format("YYYY");
    default:
      return date.format("DD/MM");
  }
};

const trimText = (text, limit = 120) => {
  if (!text) return "Không có nội dung";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const DashboardFilters = ({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
  requestedRange,
}) => {
  const rangeStartLabel = requestedRange?.startDate
    ? dayjs(requestedRange.startDate).format("DD/MM/YYYY")
    : "-";
  const rangeEndLabel = requestedRange?.endDate
    ? dayjs(requestedRange.endDate).format("DD/MM/YYYY")
    : "-";

  return (
    <div className="dashboard-filters">
      <div className="filters-group">
        <div className="filter-control">
          <label>Khoảng thời gian</label>
          <select
            value={filters.range}
            onChange={(event) => onFilterChange("range", event.target.value)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {filters.range === "custom" && (
          <>
            <div className="filter-control">
              <label>Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  onFilterChange("startDate", event.target.value)
                }
              />
            </div>
            <div className="filter-control">
              <label>Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  onFilterChange("endDate", event.target.value)
                }
              />
            </div>
          </>
        )}

        <div className="filter-control">
          <label>Nhóm theo</label>
          <select
            value={filters.groupBy}
            onChange={(event) => onFilterChange("groupBy", event.target.value)}
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filters-meta">
        <div className="meta-row">
          <span>
            Khoảng dữ liệu: {rangeStartLabel} - {rangeEndLabel}
          </span>
          <span>
            Cập nhật lần cuối:
            {lastUpdated
              ? ` ${dayjs(lastUpdated).format("HH:mm:ss DD/MM/YYYY")}`
              : " Chưa có"}
          </span>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Đang làm mới
            </>
          ) : (
            <>
              <i className="ri-refresh-line me-2"></i>
              Làm mới
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((previous) => {
      const updated = { ...previous, [field]: value };
      if (field === "range" && value !== "custom") {
        updated.startDate = "";
        updated.endDate = "";
      }
      if (field === "groupBy" && !value) {
        updated.groupBy = "day";
      }
      return updated;
    });
  }, []);

  const queryParams = useMemo(() => {
    if (filters.range === "custom") {
      if (!filters.startDate || !filters.endDate) {
        return null;
      }
      return {
        range: filters.range,
        groupBy: filters.groupBy,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
    }

    return {
      range: filters.range,
      groupBy: filters.groupBy,
    };
  }, [filters]);

  const fetchDashboardStats = useCallback(
    async ({ silent = false, params } = {}) => {
      if (!params) return;

      try {
        if (!silent) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setError(null);
        updateToken();

        const response = await getDashboardStats(params);

        if (response?.success) {
          setStats(response.data);
          setLastUpdated(new Date());
        } else {
          throw new Error(response?.message || "Dữ liệu trả về không hợp lệ");
        }
      } catch (err) {
        console.error("Dashboard stats error:", err);
        const message =
          err?.response?.data?.message || err.message || err.toString();
        setError(`Không thể tải thống kê dashboard: ${message}`);
      } finally {
        if (!silent) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!queryParams) return;
    fetchDashboardStats({ silent: false, params: queryParams });
  }, [queryParams, fetchDashboardStats]);

  const requestedRange = stats?.requestedRange;

  const overviewCards = useMemo(() => {
    if (!stats) return [];

    const totals = stats.overview || {};
    const period = stats.periodOverview || {};

    return [
      {
        key: "users",
        label: "Tổng người dùng",
        total: totals.totalUsers,
        period: period.users,
        icon: SUMMARY_ICONS.users,
      },
      {
        key: "activeUsers",
        label: "Người dùng hoạt động",
        total: totals.activeUsers,
        period: period.users,
        icon: SUMMARY_ICONS.activeUsers,
      },
      {
        key: "posts",
        label: "Bài viết",
        total: totals.totalPosts,
        period: period.posts,
        icon: SUMMARY_ICONS.posts,
      },
      {
        key: "comments",
        label: "Bình luận",
        total: totals.totalComments,
        period: period.comments,
        icon: SUMMARY_ICONS.comments,
      },
      {
        key: "messages",
        label: "Tin nhắn",
        total: totals.totalMessages,
        period: period.messages,
        icon: SUMMARY_ICONS.messages,
      },
      {
        key: "journals",
        label: "Nhật ký",
        total: totals.totalJournals,
        period: period.journals,
        icon: SUMMARY_ICONS.journals,
      },
      {
        key: "groups",
        label: "Nhóm",
        total: totals.totalGroups,
        period: period.groups,
        icon: SUMMARY_ICONS.groups,
      },
      {
        key: "likes",
        label: "Lượt thích",
        total: totals.totalLikes,
        period: period.likes,
        icon: SUMMARY_ICONS.likes,
      },
      {
        key: "violations",
        label: "Vi phạm",
        total: totals.totalViolations,
        period: period.violations,
        icon: SUMMARY_ICONS.violations,
      },
    ];
  }, [stats]);

  const growthCards = useMemo(() => {
    const growth = stats?.growth;
    if (!growth) return [];

    const formatGrowthValue = (value) => {
      if (!value) return { delta: 0, growthRate: 0 };
      return {
        delta: value.delta,
        growthRate: value.growthRate,
      };
    };

    return [
      { key: "users", label: "Người dùng", ...formatGrowthValue(growth.users) },
      { key: "posts", label: "Bài viết", ...formatGrowthValue(growth.posts) },
      {
        key: "comments",
        label: "Bình luận",
        ...formatGrowthValue(growth.comments),
      },
      {
        key: "messages",
        label: "Tin nhắn",
        ...formatGrowthValue(growth.messages),
      },
      { key: "likes", label: "Lượt thích", ...formatGrowthValue(growth.likes) },
      {
        key: "violations",
        label: "Vi phạm",
        ...formatGrowthValue(growth.violations),
      },
      {
        key: "interactions",
        label: "Tương tác",
        ...formatGrowthValue(growth.interactions),
      },
    ];
  }, [stats]);

  const timelineData = stats?.trendSeries || [];

  const violationStatusData = useMemo(() => {
    const statusObj = stats?.violationSummary?.status || {};
    return Object.entries(statusObj)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        label: VIOLATION_STATUS_LABELS[status] || status,
        count,
      }));
  }, [stats]);

  const violationTargetData = useMemo(() => {
    return (stats?.violationSummary?.byTarget || []).map((item) => ({
      name: TARGET_TYPE_LABELS[item.targetType] || item.targetType,
      value: item.count,
    }));
  }, [stats]);

  const moodPieData = useMemo(() => {
    return (stats?.moodStats || []).map((item) => ({
      name: item.emotion || "Khác",
      value: item.count,
    }));
  }, [stats]);

  const interactionPieData = useMemo(() => {
    return (stats?.activityBreakdown?.interaction || []).map((item) => ({
      name: item.label,
      value: item.count,
    }));
  }, [stats]);

  const contentPieData = useMemo(() => {
    return (stats?.activityBreakdown?.content || []).map((item) => ({
      name: item.label,
      value: item.count,
    }));
  }, [stats]);

  const recentUsers = stats?.recentActivity?.users || [];
  const recentPosts = stats?.recentActivity?.posts || [];
  const topPosts = stats?.topPosts || [];

  const hasStats = Boolean(stats);

  const handleManualRefresh = useCallback(() => {
    if (!queryParams) return;
    fetchDashboardStats({ silent: true, params: queryParams });
  }, [fetchDashboardStats, queryParams]);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard Admin</h1>
          <p>
            Chào mừng, {user?.username || "Admin"}! Theo dõi sức khỏe hệ thống
            và các chỉ số quan trọng.
          </p>
        </div>
      </div>
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        requestedRange={requestedRange}
      />

      {error && (
        <div className="dashboard-alert alert alert-warning" role="alert">
          {error}
          <button
            className="btn btn-link ms-3 p-0 align-baseline"
            onClick={() =>
              queryParams &&
              fetchDashboardStats({ silent: false, params: queryParams })
            }
          >
            Thử lại
          </button>
        </div>
      )}

      {loading && !hasStats ? (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải thống kê...</p>
        </div>
      ) : hasStats ? (
        <>
          <div className="overview-grid">
            {overviewCards.map((card) => (
              <div key={card.key} className="overview-card">
                <div className="overview-icon">
                  <i className={card.icon}></i>
                </div>
                <div className="overview-content">
                  <h3>{card.label}</h3>
                  <div className="overview-metric">
                    <span className="total">{formatNumber(card.total)}</span>
                    <span className="period">
                      +{formatNumber(card.period || 0)} kỳ này
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {growthCards.length > 0 && (
            <div className="growth-grid">
              {growthCards.map((item) => (
                <div key={item.key} className="growth-card">
                  <span className="label">{item.label}</span>
                  <div className="value">{formatNumber(item.delta)}</div>
                  <span
                    className={`trend ${item.growthRate >= 0 ? "up" : "down"}`}
                  >
                    {item.growthRate >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(item.growthRate).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="analytics-grid">
            <div className="chart-card wide">
              <div className="card-header">
                <h2>Xu hướng nội dung</h2>
                <span className="range-label">
                  {requestedRange?.periodDays
                    ? `${requestedRange.periodDays} ngày`
                    : ""}
                </span>
              </div>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPosts"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={AREA_COLORS.posts}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={AREA_COLORS.posts}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorComments"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={AREA_COLORS.comments}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={AREA_COLORS.comments}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorMessages"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={AREA_COLORS.messages}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={AREA_COLORS.messages}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorJournals"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={AREA_COLORS.journals}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={AREA_COLORS.journals}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        formatDateLabel(
                          value,
                          requestedRange?.groupBy || filters.groupBy
                        )
                      }
                    />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="posts"
                      name="Bài viết"
                      stroke={AREA_COLORS.posts}
                      fill="url(#colorPosts)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="comments"
                      name="Bình luận"
                      stroke={AREA_COLORS.comments}
                      fill="url(#colorComments)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      name="Tin nhắn"
                      stroke={AREA_COLORS.messages}
                      fill="url(#colorMessages)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="journals"
                      name="Nhật ký"
                      stroke={AREA_COLORS.journals}
                      fill="url(#colorJournals)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Chưa có dữ liệu cho biểu đồ.</div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Người dùng & Tương tác</h2>
              </div>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={timelineData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        formatDateLabel(
                          value,
                          requestedRange?.groupBy || filters.groupBy
                        )
                      }
                    />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="Người dùng mới"
                      stroke={AREA_COLORS.users}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="interactions"
                      name="Tương tác"
                      stroke={AREA_COLORS.interactions}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Chưa có dữ liệu cho biểu đồ.</div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Vi phạm theo trạng thái</h2>
              </div>
              {violationStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={violationStatusData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Bar
                      dataKey="count"
                      fill={AREA_COLORS.violations}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  Không có báo cáo vi phạm trong giai đoạn này.
                </div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Phân bổ vi phạm theo đối tượng</h2>
              </div>
              {violationTargetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={violationTargetData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {violationTargetData.map((entry, index) => (
                        <Cell
                          key={`violation-target-${entry.name}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Không có dữ liệu vi phạm.</div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Phân bổ cảm xúc</h2>
              </div>
              {moodPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={moodPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {moodPieData.map((entry, index) => (
                        <Cell
                          key={`mood-${entry.name}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Chưa có dữ liệu cảm xúc.</div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Phân bổ nội dung</h2>
              </div>
              {contentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={contentPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {contentPieData.map((entry, index) => (
                        <Cell
                          key={`content-${entry.name}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Không có dữ liệu nội dung.</div>
              )}
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h2>Tương tác nổi bật</h2>
              </div>
              {interactionPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={interactionPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {interactionPieData.map((entry, index) => (
                        <Cell
                          key={`interaction-${entry.name}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Chưa có dữ liệu tương tác.</div>
              )}
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="section">
              <h2>Người dùng mới</h2>
              <div className="recent-list">
                {recentUsers.length ? (
                  recentUsers.map((recentUser) => (
                    <div key={recentUser._id} className="recent-item">
                      <div className="user-info">
                        <div className="avatar">
                          <i className="ri-user-line"></i>
                        </div>
                        <div className="details">
                          <h4>{recentUser.username}</h4>
                          <p>{recentUser.email}</p>
                          <small>
                            {recentUser.createdAt
                              ? dayjs(recentUser.createdAt).format("DD/MM/YYYY")
                              : ""}
                          </small>
                        </div>
                      </div>
                      <span className={`role-badge role-${recentUser.role}`}>
                        {recentUser.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Không có người dùng mới.</div>
                )}
              </div>
            </div>

            <div className="section">
              <h2>Bài viết gần đây</h2>
              <div className="recent-list">
                {recentPosts.length ? (
                  recentPosts.map((post) => (
                    <div key={post._id} className="recent-item">
                      <div className="post-info">
                        <div className="avatar">
                          <i className="ri-file-text-line"></i>
                        </div>
                        <div className="details">
                          <h4>{post.userCreateID?.username || "Ẩn danh"}</h4>
                          <p>{trimText(post.content, 80)}</p>
                          <small>
                            {post.createdAt
                              ? dayjs(post.createdAt).format("DD/MM/YYYY")
                              : ""}
                          </small>
                        </div>
                      </div>
                      <div className="post-stats">
                        <span>
                          <i className="ri-heart-line"></i>{" "}
                          {formatNumber(
                            post.likeCount || post.likes?.length || 0
                          )}
                        </span>
                        <span>
                          <i className="ri-chat-3-line"></i>{" "}
                          {formatNumber(
                            post.commentCount || post.comments?.length || 0
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Không có bài viết mới.</div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-sections single">
            <div className="section">
              <h2>Bài viết nổi bật</h2>
              <div className="recent-list">
                {topPosts.length ? (
                  topPosts.map((post) => (
                    <div key={post._id} className="recent-item">
                      <div className="post-info">
                        <div className="avatar">
                          <i className="ri-star-line"></i>
                        </div>
                        <div className="details">
                          <h4>{post.userCreateID?.username || "Ẩn danh"}</h4>
                          <p>{trimText(post.content, 100)}</p>
                          <small>
                            {post.createdAt
                              ? dayjs(post.createdAt).format("DD/MM/YYYY")
                              : ""}
                          </small>
                        </div>
                      </div>
                      <div className="post-stats">
                        <span>
                          <i className="ri-heart-line"></i>{" "}
                          {formatNumber(post.likeCount || 0)}
                        </span>
                        <span>
                          <i className="ri-chat-3-line"></i>{" "}
                          {formatNumber(post.commentCount || 0)}
                        </span>
                        {post.warningCount > 0 && (
                          <span className="badge bg-warning text-dark">
                            {post.warningCount} cảnh báo
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Chưa có bài viết nổi bật.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Chưa có dữ liệu trong khoảng thời gian này.
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
