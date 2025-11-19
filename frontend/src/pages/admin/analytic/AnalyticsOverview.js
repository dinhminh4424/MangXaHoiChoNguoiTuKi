// src/components/admin/analytics/AnalyticsDashboard.js
import React, { useState } from "react";

// Custom hooks và components
import { useEnhancedAnalytics } from "../../../hooks/useAdminAnalytics";
import EnhancedFilterPanel from "../../../components/admin/analytics/FilterPanel";
import ChartContainer from "../../../components/admin/analytics/ChartContainer";
import ChartRenderer from "../../../components/admin/analytics/ChartRenderer";
import KPICard from "../../../components/admin/analytics/KPICard";
import AlertCard from "../../../components/admin/analytics/AlertCard";

import { Container, Row, Col, Card, Button } from "react-bootstrap";

import {
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

const AnalyticsDashboard = () => {
  const {
    overviewData,
    chartData,
    chartConfigs,
    loading,
    error,
    period,
    filters,
    refreshData,
    applyFilters,
    resetFilters,
    updateChartConfig,
    toggleChartVisibility,
    getChartData,
    getChartConfig,
    exportData,
  } = useEnhancedAnalytics();

  if (loading && !overviewData) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải dữ liệu analytics...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi:</strong> {error}
        </div>
        <Button variant="primary" onClick={refreshData}>
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!overviewData) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <p className="text-muted">Không có dữ liệu để hiển thị</p>
          <Button variant="primary" onClick={refreshData}>
            Tải dữ liệu
          </Button>
        </div>
      </Container>
    );
  }

  const { kpis, charts, alerts, summary } = overviewData.data;

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-1">Analytics Dashboard</h4>
              <p className="text-muted mb-0">
                Dữ liệu từ{" "}
                {new Date(summary?.period?.start).toLocaleDateString("vi-VN")}{" "}
                đến {new Date(summary?.period?.end).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <Button variant="outline-primary" onClick={refreshData}>
              <RefreshCw size={16} className="me-2" />
              Làm mới
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Filter Panel */}
        <Col lg={3}>
          <EnhancedFilterPanel
            filters={filters}
            onFiltersChange={applyFilters}
            onReset={resetFilters}
          />
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* KPI Cards */}
          <Row className="g-3 mb-4">
            <Col xl={3} lg={6}>
              <KPICard
                title="Người dùng hoạt động"
                value={kpis?.activeUsers?.current || 0}
                trend={kpis?.activeUsers?.trend || 0}
                total={kpis?.activeUsers?.total || 0}
                icon={Users}
                color="primary"
                description="Số người dùng hoạt động trong kỳ"
                onRefresh={refreshData}
                onExport={() => exportData("csv", "users")}
              />
            </Col>
            <Col xl={3} lg={6}>
              <KPICard
                title="Bài viết mới"
                value={kpis?.newPosts?.current || 0}
                trend={kpis?.newPosts?.trend || 0}
                total={kpis?.newPosts?.total || 0}
                icon={FileText}
                color="success"
                description="Số bài viết mới trong kỳ"
                onRefresh={refreshData}
                onExport={() => exportData("csv", "posts")}
              />
            </Col>
            <Col xl={3} lg={6}>
              <KPICard
                title="Vi phạm"
                value={kpis?.violations?.current || 0}
                trend={kpis?.violations?.trend || 0}
                total={kpis?.violations?.total || 0}
                icon={AlertTriangle}
                color="danger"
                description="Số vi phạm được báo cáo"
                onRefresh={refreshData}
                onExport={() => exportData("csv", "violations")}
              />
            </Col>
            <Col xl={3} lg={6}>
              <KPICard
                title="Tỷ lệ tương tác"
                value={`${kpis?.engagementRate?.current || 0}%`}
                trend={kpis?.engagementRate?.trend || 0}
                icon={TrendingUp}
                color="info"
                description="Tỷ lệ tương tác trung bình"
                onRefresh={refreshData}
                onExport={() => exportData("csv", "engagement")}
              />
            </Col>
          </Row>

          {/* Charts */}
          <Row className="g-4">
            {/* Người dùng hoạt động */}
            <Col xl={6}>
              <ChartContainer
                title="Người dùng hoạt động theo ngày"
                chartId="activeUsersChart"
                chartConfig={getChartConfig("activeUsersChart")}
                onConfigChange={updateChartConfig}
                onToggleVisibility={toggleChartVisibility}
              >
                <ChartRenderer
                  chartId="activeUsersChart"
                  data={getChartData("activeUsersChart")}
                  config={getChartConfig("activeUsersChart")}
                />
              </ChartContainer>
            </Col>

            {/* Bài viết mới */}
            <Col xl={6}>
              <ChartContainer
                title="Bài viết mới theo tuần"
                chartId="postsChart"
                chartConfig={getChartConfig("postsChart")}
                onConfigChange={updateChartConfig}
                onToggleVisibility={toggleChartVisibility}
              >
                <ChartRenderer
                  chartId="postsChart"
                  data={getChartData("postsChart")}
                  config={getChartConfig("postsChart")}
                />
              </ChartContainer>
            </Col>

            {/* Phân loại vi phạm */}
            <Col xl={6}>
              <ChartContainer
                title="Phân loại vi phạm"
                chartId="violationTypesChart"
                chartConfig={getChartConfig("violationTypesChart")}
                onConfigChange={updateChartConfig}
                onToggleVisibility={toggleChartVisibility}
              >
                <ChartRenderer
                  chartId="violationTypesChart"
                  data={getChartData("violationTypesChart")}
                  config={getChartConfig("violationTypesChart")}
                />
              </ChartContainer>
            </Col>

            {/* Tương tác người dùng */}
            <Col xl={6}>
              <ChartContainer
                title="Tương tác người dùng"
                chartId="userEngagementChart"
                chartConfig={getChartConfig("userEngagementChart")}
                onConfigChange={updateChartConfig}
                onToggleVisibility={toggleChartVisibility}
              >
                <ChartRenderer
                  chartId="userEngagementChart"
                  data={getChartData("userEngagementChart")}
                  config={getChartConfig("userEngagementChart")}
                />
              </ChartContainer>
            </Col>
          </Row>

          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <Row className="mt-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0">
                    <h5 className="mb-0 fw-semibold">Cảnh báo hệ thống</h5>
                  </Card.Header>
                  <Card.Body>
                    {alerts.map((alert, index) => (
                      <AlertCard key={index} alert={alert} />
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AnalyticsDashboard;
