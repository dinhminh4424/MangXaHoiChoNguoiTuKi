// src/hooks/useEnhancedAnalytics.js
import { useState, useEffect, useCallback, useRef } from "react";
import AdminAnalyticsService from "../services/adminAnalyticsService";

export const useEnhancedAnalytics = (initialPeriod = "today") => {
  const [overviewData, setOverviewData] = useState(null);
  const [chartData, setChartData] = useState({});
  const [chartConfigs, setChartConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(initialPeriod);
  const [filters, setFilters] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Sử dụng useRef để tránh dependency loop
  const chartConfigsRef = useRef({});
  const filtersRef = useRef({});
  const periodRef = useRef(initialPeriod);

  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    chartConfigsRef.current = chartConfigs;
    filtersRef.current = filters;
    periodRef.current = period;
  }, [chartConfigs, filters, period]);

  // Khởi tạo chart configs mặc định - CHỈ CHẠY 1 LẦN
  const initializeChartConfigs = useCallback(() => {
    const defaultConfigs = {
      activeUsersChart: {
        type: "line",
        visible: true,
        metrics: ["activeUsers"],
        colors: ["#0088FE"],
        showGrid: true,
        showLegend: true,
        smooth: true,
        stacked: false,
        title: "Người dùng hoạt động theo ngày",
      },
      postsChart: {
        type: "bar",
        visible: true,
        metrics: ["newPosts"],
        colors: ["#00C49F"],
        showGrid: true,
        showLegend: true,
        stacked: false,
        title: "Bài viết mới theo tuần",
      },
      violationsChart: {
        type: "bar",
        visible: true,
        metrics: ["violations"],
        colors: ["#FF8042"],
        showGrid: true,
        showLegend: true,
        stacked: true,
        title: "Vi phạm theo thời gian",
      },
      violationTypesChart: {
        type: "pie",
        visible: true,
        metrics: ["count"],
        colors: "default",
        showLabels: true,
        showPercentages: true,
        showLegend: true,
        stacked: true,
        title: "Phân loại vi phạm",
      },
      userEngagementChart: {
        type: "line",
        visible: true,
        metrics: ["activeUsers", "newUsers"],
        colors: ["#0088FE", "#00C49F"],
        showGrid: true,
        showLegend: true,
        smooth: true,
        title: "Tương tác người dùng",
      },
    };

    // Chỉ set state nếu chưa được khởi tạo
    setChartConfigs((prev) => {
      if (Object.keys(prev).length === 0) {
        return defaultConfigs;
      }
      return prev;
    });
  }, []);

  // Fetch overview data với filters - FIX: Sử dụng refs để tránh dependency
  const fetchOverview = useCallback(
    async (selectedPeriod = null, selectedFilters = null) => {
      const currentPeriod = selectedPeriod || periodRef.current;
      const currentFilters = selectedFilters || filtersRef.current;

      setLoading(true);
      setError(null);
      try {
        const data = await AdminAnalyticsService.getOverview(
          currentPeriod,
          currentFilters
        );
        setOverviewData(data);
        setLastUpdated(new Date().toISOString());

        // Chuẩn bị dữ liệu biểu đồ
        prepareChartData(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Lỗi khi tải dữ liệu analytics"
        );
        console.error("Fetch overview error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  ); // Empty dependencies vì sử dụng refs

  // Chuẩn bị dữ liệu cho các biểu đồ
  const prepareChartData = useCallback((data) => {
    if (!data?.data) return;

    const newChartData = {};

    // 1. Dữ liệu người dùng hoạt động theo ngày
    if (data.data.charts?.activeUsersByDay) {
      newChartData.activeUsersChart = data.data.charts.activeUsersByDay.map(
        (item) => ({
          date: item.date,
          activeUsers: item.activeUsers || item.count || 0,
        })
      );
    } else {
      // Fallback data nếu không có dữ liệu
      newChartData.activeUsersChart = generateFallbackData(
        "day",
        "activeUsers"
      );
    }

    // 2. Dữ liệu bài viết theo tuần
    if (data.data.charts?.postsByWeek) {
      newChartData.postsChart = data.data.charts.postsByWeek.map((item) => ({
        week: `Tuần ${item.week || item._id || "1"}`,
        newPosts: item.newPosts || item.count || 0,
      }));
    } else {
      newChartData.postsChart = generateFallbackData("week", "newPosts");
    }

    // 3. Dữ liệu phân loại vi phạm
    if (data.data.charts?.violationTypes) {
      newChartData.violationTypesChart = data.data.charts.violationTypes.map(
        (item) => ({
          reason: item.reason || "Không xác định",
          count: item.count || 0,
          name: item.reason || "Không xác định", // Thêm name cho pie chart
        })
      );
    } else {
      newChartData.violationTypesChart = [
        { reason: "Spam", count: 5, name: "Spam" },
        {
          reason: "Nội dung không phù hợp",
          count: 3,
          name: "Nội dung không phù hợp",
        },
        { reason: "Quấy rối", count: 2, name: "Quấy rối" },
      ];
    }

    // 4. Dữ liệu vi phạm theo thời gian
    if (data.data.charts?.violationTypes) {
      const violationsByTime = data.data.charts.violationTypes
        .slice(0, 4)
        .map((item, index) => ({
          period: `T${index + 1}`,
          violations: item.count || 0,
          [item.reason]: item.count || 0,
        }));
      newChartData.violationsChart = violationsByTime;
    } else {
      newChartData.violationsChart = generateFallbackData(
        "period",
        "violations"
      );
    }

    // 5. Dữ liệu tương tác người dùng - Sử dụng dữ liệu thực từ KPIs
    if (data.data.kpis && data.data.charts?.userEngagement) {
      newChartData.userEngagementChart = data.data.charts.userEngagement.map(
        (item) => ({
          date: item.date,
          activeUsers: item.activeUsers || 0,
          newUsers: item.newUsers || 0,
          posts: item.posts || 0,
        })
      );
    } else if (data.data.kpis) {
      // Tạo dữ liệu từ KPIs nếu có
      newChartData.userEngagementChart = generateEngagementData(data.data.kpis);
    } else {
      newChartData.userEngagementChart = generateFallbackData(
        "day",
        "engagement"
      );
    }

    setChartData(newChartData);
  }, []);

  // Hàm helper để tạo dữ liệu fallback
  const generateFallbackData = (type, metric) => {
    const data = [];
    const count = type === "day" ? 7 : 4;

    for (let i = 0; i < count; i++) {
      if (type === "day") {
        const date = new Date();
        date.setDate(date.getDate() - (count - i - 1));
        data.push({
          date: date.toISOString().split("T")[0],
          [metric]: Math.floor(Math.random() * 100) + 20,
        });
      } else if (type === "week") {
        data.push({
          week: `Tuần ${i + 1}`,
          [metric]: Math.floor(Math.random() * 50) + 10,
        });
      } else {
        data.push({
          period: `T${i + 1}`,
          [metric]: Math.floor(Math.random() * 30) + 5,
        });
      }
    }
    return data;
  };

  // Tạo dữ liệu tương tác từ KPIs
  const generateEngagementData = (kpis) => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      data.push({
        date: date.toISOString().split("T")[0],
        activeUsers: Math.floor(
          (kpis.activeUsers?.current || 100) * (0.8 + Math.random() * 0.4)
        ),
        newUsers: Math.floor(
          (kpis.newUsers?.current || 20) * (0.5 + Math.random() * 1)
        ),
        posts: Math.floor(
          (kpis.newPosts?.current || 15) * (0.7 + Math.random() * 0.6)
        ),
      });
    }
    return data;
  };

  // Cập nhật chart config
  const updateChartConfig = useCallback((chartId, updates) => {
    setChartConfigs((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], ...updates },
    }));
  }, []);

  // Toggle hiển thị chart
  const toggleChartVisibility = useCallback((chartId) => {
    setChartConfigs((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        visible: !prev[chartId]?.visible,
      },
    }));
  }, []);

  // Thay đổi metric của chart
  const updateChartMetrics = useCallback(
    (chartId, metrics) => {
      updateChartConfig(chartId, { metrics });
    },
    [updateChartConfig]
  );

  // Thay đổi period - FIX: Sử dụng callback trực tiếp
  const changePeriod = useCallback(
    (newPeriod) => {
      setPeriod(newPeriod);
      // Gọi fetchOverview trực tiếp với period mới
      setLoading(true);
      AdminAnalyticsService.getOverview(newPeriod, filtersRef.current)
        .then((data) => {
          setOverviewData(data);
          setLastUpdated(new Date().toISOString());
          prepareChartData(data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [prepareChartData]
  );

  // Áp dụng filters - FIX: Sử dụng callback trực tiếp
  const applyFilters = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      // Gọi fetchOverview trực tiếp với filters mới
      setLoading(true);
      AdminAnalyticsService.getOverview(periodRef.current, newFilters)
        .then((data) => {
          setOverviewData(data);
          setLastUpdated(new Date().toISOString());
          prepareChartData(data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [prepareChartData]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
    // Gọi fetchOverview trực tiếp với filters rỗng
    setLoading(true);
    AdminAnalyticsService.getOverview(periodRef.current, {})
      .then((data) => {
        setOverviewData(data);
        setLastUpdated(new Date().toISOString());
        prepareChartData(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [prepareChartData]);

  // Refresh data
  const refreshData = useCallback(() => {
    setLoading(true);
    AdminAnalyticsService.getOverview(periodRef.current, filtersRef.current)
      .then((data) => {
        setOverviewData(data);
        setLastUpdated(new Date().toISOString());
        prepareChartData(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [prepareChartData]);

  // Export data
  const exportData = async (format = "csv", type = "overview") => {
    try {
      await AdminAnalyticsService.exportAnalytics(
        format,
        periodRef.current,
        type,
        filtersRef.current
      );
    } catch (err) {
      setError("Lỗi khi xuất dữ liệu");
      console.error("Export error:", err);
    }
  };

  // Lấy dữ liệu biểu đồ theo ID
  const getChartData = useCallback(
    (chartId) => {
      return chartData[chartId] || [];
    },
    [chartData]
  );

  // Lấy config biểu đồ theo ID
  const getChartConfig = useCallback(
    (chartId) => {
      return chartConfigs[chartId] || {};
    },
    [chartConfigs]
  );

  // FIX: Chỉ chạy 1 lần khi component mount
  useEffect(() => {
    initializeChartConfigs();

    // Fetch data ban đầu
    fetchOverview();
  }, []); // Empty dependency array - chỉ chạy 1 lần

  return {
    // Data
    overviewData,
    chartData,
    chartConfigs,

    // State
    loading,
    error,
    period,
    filters,
    lastUpdated,

    // Actions
    fetchOverview,
    changePeriod,
    applyFilters,
    resetFilters,
    refreshData,
    exportData,

    // Chart functions
    updateChartConfig,
    toggleChartVisibility,
    updateChartMetrics,
    getChartData,
    getChartConfig,
  };
};
