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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardStats } from "../../services/adminService";
import { updateToken } from "../../services/api";
import "./AdminDashboard.css";

// React Icons
import {
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiMessageSquare,
  FiMessageCircle,
  FiBookOpen,
  FiUsers as FiGroup,
  FiAlertTriangle,
  FiHeart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiStar,
  FiRefreshCw,
  FiCalendar,
  FiFilter,
  FiEye,
  FiArrowUpRight,
  FiArrowDownRight,
  FiChevronRight,
  FiGlobe,
  FiClock,
  FiBell,
  FiShield,
  FiDatabase,
} from "react-icons/fi";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 ngày", icon: <FiCalendar /> },
  { value: "30d", label: "30 ngày", icon: <FiCalendar /> },
  { value: "90d", label: "90 ngày", icon: <FiCalendar /> },
  { value: "180d", label: "6 tháng", icon: <FiCalendar /> },
  { value: "365d", label: "12 tháng", icon: <FiCalendar /> },
  { value: "mtd", label: "Tháng này", icon: <FiCalendar /> },
  { value: "ytd", label: "Từ đầu năm", icon: <FiCalendar /> },
  { value: "custom", label: "Tùy chỉnh", icon: <FiFilter /> },
];

const GROUP_OPTIONS = [
  { value: "day", label: "Theo ngày", icon: <FiActivity /> },
  { value: "month", label: "Theo tháng", icon: <FiBarChart2 /> },
  { value: "year", label: "Theo năm", icon: <FiPieChart /> },
];

const CHART_COLORS = {
  primary: "#667eea",
  secondary: "#764ba2",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
  cyan: "#06b6d4",
};

const CHART_GRADIENTS = {
  users: { start: "#667eea", end: "#764ba2" },
  posts: { start: "#10b981", end: "#3b82f6" },
  comments: { start: "#f59e0b", end: "#ec4899" },
  messages: { start: "#8b5cf6", end: "#6366f1" },
  interactions: { start: "#06b6d4", end: "#3b82f6" },
  violations: { start: "#ef4444", end: "#f97316" },
  mood: { start: "#8b5cf6", end: "#ec4899" },
};

const SUMMARY_ICONS = {
  totalUsers: <FiUsers size={24} />,
  activeUsers: <FiUserCheck size={24} />,
  posts: <FiFileText size={24} />,
  comments: <FiMessageSquare size={24} />,
  messages: <FiMessageCircle size={24} />,
  journals: <FiBookOpen size={24} />,
  groups: <FiGroup size={24} />,
  violations: <FiAlertTriangle size={24} />,
  moodLogs: <FiActivity size={24} />,
  likes: <FiHeart size={24} />,
};

const METRIC_CARDS = [
  {
    key: "totalUsers",
    label: "Tổng người dùng",
    color: CHART_COLORS.primary,
    icon: SUMMARY_ICONS.totalUsers,
  },
  {
    key: "activeUsers",
    label: "Đang hoạt động",
    color: CHART_COLORS.success,
    icon: SUMMARY_ICONS.activeUsers,
  },
  {
    key: "posts",
    label: "Bài viết",
    color: CHART_COLORS.info,
    icon: SUMMARY_ICONS.posts,
  },
  {
    key: "comments",
    label: "Bình luận",
    color: CHART_COLORS.warning,
    icon: SUMMARY_ICONS.comments,
  },
  {
    key: "messages",
    label: "Tin nhắn",
    color: CHART_COLORS.purple,
    icon: SUMMARY_ICONS.messages,
  },
  {
    key: "journals",
    label: "Nhật ký",
    color: CHART_COLORS.teal,
    icon: SUMMARY_ICONS.journals,
  },
  {
    key: "groups",
    label: "Nhóm",
    color: CHART_COLORS.indigo,
    icon: SUMMARY_ICONS.groups,
  },
  {
    key: "violations",
    label: "Vi phạm",
    color: CHART_COLORS.danger,
    icon: SUMMARY_ICONS.violations,
  },
  {
    key: "moodLogs",
    label: "Cảm xúc",
    color: CHART_COLORS.pink,
    icon: SUMMARY_ICONS.moodLogs,
  },
  {
    key: "likes",
    label: "Lượt thích",
    color: CHART_COLORS.orange,
    icon: SUMMARY_ICONS.likes,
  },
];

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

  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toLocaleString("vi-VN");
};

const formatDateLabel = (value, groupBy) => {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return value;

  switch (groupBy) {
    case "month":
      return date.format("MMM YYYY");
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
    <div className="ad-filter-container">
      <div className="ad-filter-header">
        <div className="ad-filter-title">
          <FiFilter className="ad-filter-icon" />
          <h2>Bộ lọc Dữ liệu Thống kê</h2>
        </div>
        <div className="ad-filter-meta">
          <div className="ad-meta-item">
            <FiCalendar className="ad-meta-icon" />
            <div>
              <span className="ad-meta-label">Khoảng dữ liệu</span>
              <span className="ad-meta-value">
                {rangeStartLabel} - {rangeEndLabel}
              </span>
            </div>
          </div>
          <div className="ad-meta-item">
            <FiClock className="ad-meta-icon" />
            <div>
              <span className="ad-meta-label">Cập nhật lần cuối</span>
              <span className="ad-meta-value">
                {lastUpdated
                  ? dayjs(lastUpdated).format("HH:mm DD/MM")
                  : "Chưa có"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ad-filter-content">
        <div className="ad-filter-controls">
          <div className="ad-filter-group">
            <div className="ad-control">
              <label className="ad-control-label">
                <FiCalendar className="me-2" />
                Khoảng thời gian
              </label>
              <div className="ad-select-wrapper">
                <select
                  className="ad-select"
                  value={filters.range}
                  onChange={(e) => onFilterChange("range", e.target.value)}
                >
                  {RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FiChevronRight className="ad-select-arrow" />
              </div>
            </div>

            {filters.range === "custom" && (
              <>
                <div className="ad-control">
                  <label className="ad-control-label">
                    <FiCalendar className="me-2" />
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    className="ad-input"
                    value={filters.startDate}
                    onChange={(e) =>
                      onFilterChange("startDate", e.target.value)
                    }
                  />
                </div>
                <div className="ad-control">
                  <label className="ad-control-label">
                    <FiCalendar className="me-2" />
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    className="ad-input"
                    value={filters.endDate}
                    onChange={(e) => onFilterChange("endDate", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="ad-control">
              <label className="ad-control-label">
                <FiBarChart2 className="me-2" />
                Nhóm theo
              </label>
              <div className="ad-select-wrapper">
                <select
                  className="ad-select"
                  value={filters.groupBy}
                  onChange={(e) => onFilterChange("groupBy", e.target.value)}
                >
                  {GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FiChevronRight className="ad-select-arrow" />
              </div>
            </div>
          </div>

          <button
            className="ad-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <div className="ad-spinner"></div>
                <span>Đang làm mới...</span>
              </>
            ) : (
              <>
                <FiRefreshCw className="me-2" />
                <span>Làm mới Dữ liệu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, description, icon, color, trend }) => {
  const trendValue = trend?.value || 0;
  const trendDirection = trend?.direction || "neutral";

  return (
    <div className="ad-metric-card" style={{ borderTopColor: color }}>
      <div className="ad-metric-header">
        <div
          className="ad-metric-icon"
          style={{ backgroundColor: `${color}15` }}
        >
          {React.cloneElement(icon, { color: color })}
        </div>
        <div className="ad-metric-trend">
          {trendDirection !== "neutral" && (
            <span className={`ad-trend-badge ${trendDirection}`}>
              {trendDirection === "up" ? (
                <FiArrowUpRight className="me-1" />
              ) : (
                <FiArrowDownRight className="me-1" />
              )}
              {Math.abs(trendValue).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="ad-metric-content">
        <h3 className="ad-metric-value">{value}</h3>
        <p className="ad-metric-title">{title}</p>
        {description && <p className="ad-metric-description">{description}</p>}
      </div>
      <div className="ad-metric-footer">
        <div className="ad-progress-bar">
          <div
            className="ad-progress-fill"
            style={{
              width: `${Math.min(100, trendValue + 50)}%`,
              backgroundColor: color,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const ChartContainer = ({ title, subtitle, children, className = "" }) => (
  <div className={`ad-chart-container ${className}`}>
    <div className="ad-chart-header">
      <div>
        <h3 className="ad-chart-title">{title}</h3>
        {subtitle && <p className="ad-chart-subtitle">{subtitle}</p>}
      </div>
      <button className="ad-chart-zoom">
        <FiEye size={18} />
      </button>
    </div>
    <div className="ad-chart-content">{children}</div>
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
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };
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
        setError(`Không thể tải thống kê: ${message}`);
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
    const growth = stats.growth || {};

    return METRIC_CARDS.map((card) => {
      const totalValue = totals[card.key] || 0;
      const periodValue = period[card.key] || 0;
      const growthData = growth[card.key] || {};

      let trend = { direction: "neutral", value: 0 };
      if (growthData.growthRate) {
        trend = {
          direction: growthData.growthRate >= 0 ? "up" : "down",
          value: Math.abs(growthData.growthRate),
        };
      } else if (periodValue > 0) {
        trend = { direction: "up", value: 10 };
      }

      return {
        ...card,
        total: totalValue,
        period: periodValue,
        formattedValue: formatNumber(totalValue),
        description: `+${formatNumber(periodValue)} trong kỳ`,
        trend,
      };
    });
  }, [stats]);

  const growthCards = useMemo(() => {
    const growth = stats?.growth;
    if (!growth) return [];

    return [
      { key: "users", label: "Người dùng", ...(growth.users || {}) },
      { key: "posts", label: "Bài viết", ...(growth.posts || {}) },
      { key: "comments", label: "Bình luận", ...(growth.comments || {}) },
      { key: "messages", label: "Tin nhắn", ...(growth.messages || {}) },
      { key: "likes", label: "Lượt thích", ...(growth.likes || {}) },
      { key: "violations", label: "Vi phạm", ...(growth.violations || {}) },
      {
        key: "interactions",
        label: "Tương tác",
        ...(growth.interactions || {}),
      },
    ].filter((item) => item.delta !== undefined);
  }, [stats]);

  const timelineData = stats?.trendSeries || [];

  const violationStatusData = useMemo(() => {
    const statusObj = stats?.violationSummary?.status || {};
    return Object.entries(statusObj)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color:
          status === "pending"
            ? CHART_COLORS.warning
            : status === "approved"
            ? CHART_COLORS.success
            : CHART_COLORS.danger,
      }));
  }, [stats]);

  const violationTargetData = useMemo(() => {
    return (stats?.violationSummary?.byTarget || []).map((item, index) => ({
      name: item.targetType || "Khác",
      value: item.count,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
    }));
  }, [stats]);

  const moodData = useMemo(() => {
    return (stats?.moodStats || []).map((item, index) => ({
      name: item.emotion || "Khác",
      value: item.count,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
    }));
  }, [stats]);

  const interactionData = useMemo(() => {
    return (stats?.activityBreakdown?.interaction || []).map((item, index) => ({
      name: item.label,
      value: item.count,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
    }));
  }, [stats]);

  const contentData = useMemo(() => {
    return (stats?.activityBreakdown?.content || []).map((item, index) => ({
      name: item.label,
      value: item.count,
      color:
        Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="ad-custom-tooltip">
          <p className="ad-tooltip-label">
            {formatDateLabel(label, requestedRange?.groupBy)}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="ad-tooltip-item"
              style={{ color: entry.color }}
            >
              <span
                className="ad-tooltip-dot"
                style={{ backgroundColor: entry.color }}
              ></span>
              {entry.name}: <strong>{formatNumber(entry.value)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="ad-custom-tooltip">
          <p className="ad-tooltip-label">{data.name}</p>
          <p className="ad-tooltip-value">{formatNumber(data.value)}</p>
          <p className="ad-tooltip-percent">
            {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ad-dashboard">
      {/* Dashboard Header */}
      <div className="ad-header">
        <div className="ad-header-content">
          <div className="ad-header-title">
            <h1 className="ad-main-title">
              <FiGlobe className="ad-title-icon" />
              Dashboard Quản trị
            </h1>
            <p className="ad-subtitle">
              Xin chào, <strong>{user?.username || "Administrator"}</strong>!
              Theo dõi và phân tích toàn diện hệ thống của bạn.
            </p>
          </div>
          <div className="ad-header-stats">
            <div className="ad-stat-badge">
              <FiActivity className="me-2" />
              <span>Dữ liệu thời gian thực</span>
            </div>
            <div className="ad-stat-badge success">
              <FiTrendingUp className="me-2" />
              <span>
                Tổng {formatNumber(stats?.overview?.totalUsers || 0)} người dùng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        requestedRange={requestedRange}
      />

      {/* Error Alert */}
      {error && (
        <div className="ad-alert error">
          <div className="ad-alert-content">
            <FiAlertTriangle className="ad-alert-icon" />
            <span>{error}</span>
          </div>
          <button
            className="ad-alert-action"
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
        <div className="ad-loading">
          <div className="ad-spinner-large"></div>
          <p className="ad-loading-text">Đang tải thống kê...</p>
        </div>
      ) : hasStats ? (
        <>
          {/* Metrics Overview */}
          {/* <div className="ad-metrics-grid">
            {overviewCards.map((card) => (
              <MetricCard
                key={card.key}
                title={card.label}
                value={card.formattedValue}
                description={card.description}
                icon={card.icon}
                color={card.color}
                trend={card.trend}
              />
            ))}
          </div> */}

          {/* Growth Section */}
          {growthCards.length > 0 && (
            <div className="ad-growth-section">
              <div className="ad-section-header">
                <h3 className="ad-section-title">
                  <FiTrendingUp className="me-2" />
                  Tăng trưởng & Hiệu suất
                </h3>
                <div className="ad-period-badge">
                  {requestedRange?.periodDays
                    ? `${requestedRange.periodDays} ngày`
                    : "30 ngày"}
                </div>
              </div>
              <div className="ad-growth-grid">
                {growthCards.map((item) => (
                  <div key={item.key} className="ad-growth-card">
                    <div className="ad-growth-label">{item.label}</div>
                    <div className="ad-growth-value">
                      {formatNumber(item.delta || 0)}
                    </div>
                    <div
                      className={`ad-growth-trend ${
                        item.growthRate >= 0 ? "up" : "down"
                      }`}
                    >
                      {item.growthRate >= 0 ? (
                        <FiArrowUpRight className="me-1" />
                      ) : (
                        <FiArrowDownRight className="me-1" />
                      )}
                      {Math.abs(item.growthRate || 0).toFixed(1)}%
                    </div>
                    <div className="ad-growth-bar">
                      <div
                        className="ad-growth-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.abs(item.growthRate || 0) + 30
                          )}%`,
                          backgroundColor:
                            item.growthRate >= 0
                              ? CHART_COLORS.success
                              : CHART_COLORS.danger,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="ad-charts-grid">
            {/* Main Area Chart - Content Trends */}
            <ChartContainer
              title="Xu hướng Nội dung"
              subtitle="Phân tích theo thời gian"
              className="wide"
            >
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
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
                          stopColor={CHART_GRADIENTS.posts.start}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_GRADIENTS.posts.end}
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
                          stopColor={CHART_GRADIENTS.comments.start}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_GRADIENTS.comments.end}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorInteractions"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_GRADIENTS.interactions.start}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_GRADIENTS.interactions.end}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatDateLabel(value, requestedRange?.groupBy)
                      }
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="posts"
                      name="Bài viết"
                      stroke={CHART_GRADIENTS.posts.start}
                      fill="url(#colorPosts)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="comments"
                      name="Bình luận"
                      stroke={CHART_GRADIENTS.comments.start}
                      fill="url(#colorComments)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="interactions"
                      name="Tương tác"
                      stroke={CHART_GRADIENTS.interactions.start}
                      fill="url(#colorInteractions)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiBarChart2 size={48} />
                  <p>Chưa có dữ liệu cho biểu đồ</p>
                </div>
              )}
            </ChartContainer>

            {/* Line Chart - Users & Messages */}
            <ChartContainer title="Người dùng & Tin nhắn">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={timelineData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatDateLabel(value, requestedRange?.groupBy)
                      }
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="Người dùng mới"
                      stroke={CHART_GRADIENTS.users.start}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      name="Tin nhắn"
                      stroke={CHART_GRADIENTS.messages.start}
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiTrendingUp size={48} />
                  <p>Chưa có dữ liệu cho biểu đồ</p>
                </div>
              )}
            </ChartContainer>

            {/* Violation Status Bar Chart */}
            <ChartContainer title="Trạng thái Vi phạm">
              {violationStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={violationStatusData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                      {violationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiAlertTriangle size={48} />
                  <p>Không có báo cáo vi phạm</p>
                </div>
              )}
            </ChartContainer>

            {/* Violation Target Pie Chart */}
            <ChartContainer title="Phân bổ Vi phạm">
              {violationTargetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violationTargetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {violationTargetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiPieChart size={48} />
                  <p>Không có dữ liệu vi phạm</p>
                </div>
              )}
            </ChartContainer>

            {/* Mood Radar Chart */}
            <ChartContainer title="Phân tích Cảm xúc">
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={moodData}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Radar
                      name="Cảm xúc"
                      dataKey="value"
                      stroke={CHART_GRADIENTS.mood.start}
                      fill={CHART_GRADIENTS.mood.start}
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiActivity size={48} />
                  <p>Chưa có dữ liệu cảm xúc</p>
                </div>
              )}
            </ChartContainer>

            {/* Interaction Distribution Pie */}
            <ChartContainer title="Phân bổ Tương tác">
              {interactionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={interactionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={(entry) =>
                        `${entry.name}: ${formatNumber(entry.value)}`
                      }
                    >
                      {interactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="ad-empty-chart">
                  <FiMessageSquare size={48} />
                  <p>Không có dữ liệu tương tác</p>
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Activity Sections */}
          <div className="ad-activity-grid">
            {/* Recent Users */}
            <div className="ad-activity-section">
              <div className="ad-activity-header">
                <h3 className="ad-activity-title">
                  <FiUsers className="me-2" />
                  Người dùng Mới
                </h3>
                <span className="ad-activity-count">
                  {recentUsers.length} người
                </span>
              </div>
              <div className="ad-activity-list">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user._id} className="ad-activity-item">
                      <div className="ad-activity-avatar">
                        <div className="ad-avatar-initial">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ad-activity-content">
                        <div className="ad-activity-name">{user.username}</div>
                        <div className="ad-activity-email">{user.email}</div>
                        <div className="ad-activity-date">
                          {dayjs(user.createdAt).format("DD/MM/YYYY")}
                        </div>
                      </div>
                      <div className={`ad-role-badge ${user.role}`}>
                        {user.role}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ad-empty-activity">
                    <FiUsers size={32} />
                    <p>Không có người dùng mới</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="ad-activity-section">
              <div className="ad-activity-header">
                <h3 className="ad-activity-title">
                  <FiFileText className="me-2" />
                  Bài viết Gần đây
                </h3>
                <span className="ad-activity-count">
                  {recentPosts.length} bài
                </span>
              </div>
              <div className="ad-activity-list">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post._id} className="ad-activity-item">
                      <div className="ad-activity-avatar">
                        <FiFileText size={20} />
                      </div>
                      <div className="ad-activity-content">
                        <div className="ad-activity-name">
                          {post.userCreateID?.username || "Ẩn danh"}
                        </div>
                        <div className="ad-activity-text">
                          {trimText(post.content, 60)}
                        </div>
                        <div className="ad-activity-stats">
                          <span className="ad-stat-item">
                            <FiHeart size={14} />{" "}
                            {formatNumber(post.likeCount || 0)}
                          </span>
                          <span className="ad-stat-item">
                            <FiMessageSquare size={14} />{" "}
                            {formatNumber(post.commentCount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ad-empty-activity">
                    <FiFileText size={32} />
                    <p>Không có bài viết mới</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Posts */}
            <div className="ad-activity-section">
              <div className="ad-activity-header">
                <h3 className="ad-activity-title">
                  <FiStar className="me-2" />
                  Bài viết Nổi bật
                </h3>
                <span className="ad-activity-count">{topPosts.length} bài</span>
              </div>
              <div className="ad-activity-list">
                {topPosts.length > 0 ? (
                  topPosts.map((post, index) => (
                    <div key={post._id} className="ad-activity-item featured">
                      <div className="ad-rank-badge">{index + 1}</div>
                      <div className="ad-activity-content">
                        <div className="ad-activity-name">
                          {post.userCreateID?.username || "Ẩn danh"}
                        </div>
                        <div className="ad-activity-text">
                          {trimText(post.content, 80)}
                        </div>
                        <div className="ad-activity-stats">
                          <span className="ad-stat-item highlight">
                            <FiHeart size={14} />{" "}
                            {formatNumber(post.likeCount || 0)}
                          </span>
                          <span className="ad-stat-item">
                            <FiMessageSquare size={14} />{" "}
                            {formatNumber(post.commentCount || 0)}
                          </span>
                          {post.warningCount > 0 && (
                            <span className="ad-stat-item warning">
                              <FiAlertTriangle size={14} /> {post.warningCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ad-empty-activity">
                    <FiStar size={32} />
                    <p>Chưa có bài viết nổi bật</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="ad-empty-state">
          <FiDatabase size={64} />
          <h3>Chưa có dữ liệu</h3>
          <p>Không có dữ liệu trong khoảng thời gian này</p>
          <button
            className="ad-refresh-btn"
            onClick={() =>
              queryParams &&
              fetchDashboardStats({ silent: false, params: queryParams })
            }
          >
            <FiRefreshCw className="me-2" />
            Tải lại dữ liệu
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
