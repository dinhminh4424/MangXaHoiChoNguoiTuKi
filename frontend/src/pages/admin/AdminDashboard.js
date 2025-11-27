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
      <div className="filters-header">
        <h2>Bộ lọc dữ liệu</h2>
        <div className="filters-meta">
          <div className="meta-info">
            <span className="meta-label">Khoảng dữ liệu:</span>
            <span className="meta-value">
              {rangeStartLabel} - {rangeEndLabel}
            </span>
          </div>
          <div className="meta-info">
            <span className="meta-label">Cập nhật lần cuối:</span>
            <span className="meta-value">
              {lastUpdated
                ? dayjs(lastUpdated).format("HH:mm:ss DD/MM/YYYY")
                : "Chưa có"}
            </span>
          </div>
        </div>
      </div>

      <div className="filters-content">
        <div className="filters-group">
          <div className="filter-control">
            <label className="filter-label">Khoảng thời gian</label>
            <select
              className="filter-select"
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
                <label className="filter-label">Từ ngày</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.startDate}
                  onChange={(event) =>
                    onFilterChange("startDate", event.target.value)
                  }
                />
              </div>
              <div className="filter-control">
                <label className="filter-label">Đến ngày</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.endDate}
                  onChange={(event) =>
                    onFilterChange("endDate", event.target.value)
                  }
                />
              </div>
            </>
          )}

          <div className="filter-control">
            <label className="filter-label">Nhóm theo</label>
            <select
              className="filter-select"
              value={filters.groupBy}
              onChange={(event) =>
                onFilterChange("groupBy", event.target.value)
              }
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="refresh-btn"
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

const MetricCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className = "",
}) => (
  <div className={`metric-card ${className}`}>
    <div className="metric-header">
      <div className="metric-icon">
        <i className={icon}></i>
      </div>
      <div className="metric-trend">
        {trend && (
          <span className={`trend-indicator ${trend.direction}`}>
            {trend.direction === "up" ? "↗" : "↘"} {trend.value}
          </span>
        )}
      </div>
    </div>
    <div className="metric-content">
      <h3 className="metric-value">{value}</h3>
      <p className="metric-title">{title}</p>
      {description && <p className="metric-description">{description}</p>}
    </div>
  </div>
);

const ChartContainer = ({ title, subtitle, children, className = "" }) => (
  <div className={`chart-container ${className}`}>
    <div className="chart-header">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
    </div>
    <div className="chart-content">{children}</div>
  </div>
);

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
        trend: {
          direction: period.users > 0 ? "up" : "neutral",
          value: `+${formatNumber(period.users || 0)}`,
        },
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
        trend: {
          direction: period.posts > 0 ? "up" : "neutral",
          value: `+${formatNumber(period.posts || 0)}`,
        },
      },
      {
        key: "comments",
        label: "Bình luận",
        total: totals.totalComments,
        period: period.comments,
        icon: SUMMARY_ICONS.comments,
        trend: {
          direction: period.comments > 0 ? "up" : "neutral",
          value: `+${formatNumber(period.comments || 0)}`,
        },
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
        trend: {
          direction: period.likes > 0 ? "up" : "neutral",
          value: `+${formatNumber(period.likes || 0)}`,
        },
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
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Quản trị hệ thống</h1>
          <p className="dashboard-subtitle">
            Chào mừng, <strong>{user?.username || "Admin"}</strong>! Theo dõi
            sức khỏe hệ thống và các chỉ số quan trọng.
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
        <div className="alert-container">
          <div className="alert alert-warning" role="alert">
            <div className="alert-content">
              <i className="ri-alert-line alert-icon"></i>
              <span>{error}</span>
            </div>
            <button
              className="btn btn-link alert-action"
              onClick={() =>
                queryParams &&
                fetchDashboardStats({ silent: false, params: queryParams })
              }
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {loading && !hasStats ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          <p className="loading-text">Đang tải thống kê...</p>
        </div>
      ) : hasStats ? (
        <>
          <div className="metrics-grid">
            {overviewCards.map((card) => (
              <MetricCard
                key={card.key}
                title={card.label}
                value={formatNumber(card.total)}
                icon={card.icon}
                trend={card.trend}
                className={card.key}
              />
            ))}
          </div>

          {growthCards.length > 0 && (
            <div className="growth-section">
              <h3 className="section-title">Tăng trưởng</h3>
              <div className="growth-grid">
                {growthCards.map((item) => (
                  <div key={item.key} className="growth-card">
                    <span className="growth-label">{item.label}</span>
                    <div className="growth-value">
                      {formatNumber(item.delta)}
                    </div>
                    <span
                      className={`growth-trend ${
                        item.growthRate >= 0 ? "up" : "down"
                      }`}
                    >
                      {item.growthRate >= 0 ? "↗" : "↘"}{" "}
                      {Math.abs(item.growthRate).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="charts-grid">
            <ChartContainer
              title="Xu hướng nội dung"
              subtitle={`${
                requestedRange?.periodDays
                  ? `${requestedRange.periodDays} ngày`
                  : ""
              }`}
              className="wide"
            >
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
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
                <div className="empty-state">
                  <i className="ri-bar-chart-line empty-icon"></i>
                  <p>Chưa có dữ liệu cho biểu đồ</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Người dùng & Tương tác">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={timelineData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
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
                <div className="empty-state">
                  <i className="ri-line-chart-line empty-icon"></i>
                  <p>Chưa có dữ liệu cho biểu đồ</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Vi phạm theo trạng thái">
              {violationStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={violationStatusData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={AREA_COLORS.violations}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <i className="ri-bar-chart-line empty-icon"></i>
                  <p>Không có báo cáo vi phạm</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Phân bổ vi phạm theo đối tượng">
              {violationTargetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <i className="ri-pie-chart-line empty-icon"></i>
                  <p>Không có dữ liệu vi phạm</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Phân bổ cảm xúc">
              {moodPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <i className="ri-pie-chart-line empty-icon"></i>
                  <p>Chưa có dữ liệu cảm xúc</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Phân bổ nội dung">
              {contentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <i className="ri-pie-chart-line empty-icon"></i>
                  <p>Không có dữ liệu nội dung</p>
                </div>
              )}
            </ChartContainer>
          </div>

          <div className="activity-sections">
            <div className="activity-section">
              <h3 className="section-title">Người dùng mới</h3>
              <div className="activity-list">
                {recentUsers.length ? (
                  recentUsers.map((recentUser) => (
                    <div key={recentUser._id} className="activity-item">
                      <div className="activity-avatar">
                        <i className="ri-user-line"></i>
                      </div>
                      <div className="activity-content">
                        <h4 className="activity-name">{recentUser.username}</h4>
                        <p className="activity-meta">{recentUser.email}</p>
                        <span className="activity-date">
                          {recentUser.createdAt
                            ? dayjs(recentUser.createdAt).format("DD/MM/YYYY")
                            : ""}
                        </span>
                      </div>
                      <span className={`role-badge role-${recentUser.role}`}>
                        {recentUser.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="ri-user-line empty-icon"></i>
                    <p>Không có người dùng mới</p>
                  </div>
                )}
              </div>
            </div>

            <div className="activity-section">
              <h3 className="section-title">Bài viết gần đây</h3>
              <div className="activity-list">
                {recentPosts.length ? (
                  recentPosts.map((post) => (
                    <div key={post._id} className="activity-item">
                      <div className="activity-avatar">
                        <i className="ri-file-text-line"></i>
                      </div>
                      <div className="activity-content">
                        <h4 className="activity-name">
                          {post.userCreateID?.username || "Ẩn danh"}
                        </h4>
                        <p className="activity-text">
                          {trimText(post.content, 80)}
                        </p>
                        <span className="activity-date">
                          {post.createdAt
                            ? dayjs(post.createdAt).format("DD/MM/YYYY")
                            : ""}
                        </span>
                      </div>
                      <div className="activity-stats">
                        <span className="stat">
                          <i className="ri-heart-line"></i>{" "}
                          {formatNumber(
                            post.likeCount || post.likes?.length || 0
                          )}
                        </span>
                        <span className="stat">
                          <i className="ri-chat-3-line"></i>{" "}
                          {formatNumber(
                            post.commentCount || post.comments?.length || 0
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="ri-article-line empty-icon"></i>
                    <p>Không có bài viết mới</p>
                  </div>
                )}
              </div>
            </div>

            <div className="activity-section">
              <h3 className="section-title">Bài viết nổi bật</h3>
              <div className="activity-list">
                {topPosts.length ? (
                  topPosts.map((post) => (
                    <div key={post._id} className="activity-item featured">
                      <div className="activity-avatar">
                        <i className="ri-star-line"></i>
                      </div>
                      <div className="activity-content">
                        <h4 className="activity-name">
                          {post.userCreateID?.username || "Ẩn danh"}
                        </h4>
                        <p className="activity-text">
                          {trimText(post.content, 100)}
                        </p>
                        <span className="activity-date">
                          {post.createdAt
                            ? dayjs(post.createdAt).format("DD/MM/YYYY")
                            : ""}
                        </span>
                      </div>
                      <div className="activity-stats">
                        <span className="stat">
                          <i className="ri-heart-line"></i>{" "}
                          {formatNumber(post.likeCount || 0)}
                        </span>
                        <span className="stat">
                          <i className="ri-chat-3-line"></i>{" "}
                          {formatNumber(post.commentCount || 0)}
                        </span>
                        {post.warningCount > 0 && (
                          <span className="stat warning">
                            <i className="ri-alert-line"></i>{" "}
                            {post.warningCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="ri-star-line empty-icon"></i>
                    <p>Chưa có bài viết nổi bật</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state large">
          <i className="ri-database-2-line empty-icon"></i>
          <h3>Chưa có dữ liệu</h3>
          <p>Không có dữ liệu trong khoảng thời gian này</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
