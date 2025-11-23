// src/components/admin/analytics/ChartContainer.js
import React, { useState } from "react";
import {
  Card,
  Button,
  ButtonGroup,
  Dropdown,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Settings,
  Download,
  Filter,
  LayoutGrid,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";

const ChartContainer = ({
  title,
  children,
  actions,
  chartId,
  chartConfig,
  onConfigChange,
  onToggleVisibility, // FIX: Đảm bảo prop này được định nghĩa
  defaultCollapsed = false,
  className = "",
  exportable = true,
  customizable = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSettings, setShowSettings] = useState(false);

  // FIX: Thêm hàm xử lý mặc định nếu prop không được truyền
  const handleToggleVisibility = () => {
    if (onToggleVisibility && chartId) {
      onToggleVisibility(chartId);
    } else {
      console.warn("onToggleVisibility is not available for chart:", chartId);
    }
  };

  const handleChartTypeChange = (newType) => {
    if (onConfigChange && chartId) {
      onConfigChange(chartId, { type: newType });
    }
  };

  const handleToggleGrid = () => {
    if (onConfigChange && chartId) {
      onConfigChange(chartId, { showGrid: !chartConfig?.showGrid });
    }
  };

  const handleToggleLegend = () => {
    if (onConfigChange && chartId) {
      onConfigChange(chartId, { showLegend: !chartConfig?.showLegend });
    }
  };

  return (
    <Card className={`shadow-sm border-0 ${className}`}>
      <Card.Header className="bg-transparent border-0 py-3">
        <div className="row">
          <div className="col-12">
            {" "}
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <h5 className="mb-0 fw-semibold me-2">{title}</h5>

                {/* Visibility Toggle - FIX: Sử dụng hàm đã xử lý */}
                {customizable && chartId && (
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {chartConfig?.visible ? "Ẩn biểu đồ" : "Hiện biểu đồ"}
                      </Tooltip>
                    }
                  >
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleToggleVisibility}
                      className="me-2 border-0"
                    >
                      {chartConfig?.visible ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </Button>
                  </OverlayTrigger>
                )}

                {/* Chart Type Selector */}
                {customizable && chartId && (
                  <Dropdown className="me-2">
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      size="sm"
                      className="border-0"
                    >
                      <LayoutGrid size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => handleChartTypeChange("line")}
                      >
                        <TrendingUp size={14} className="me-2" />
                        Đường
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => handleChartTypeChange("bar")}
                      >
                        <BarChart3 size={14} className="me-2" />
                        Cột
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => handleChartTypeChange("pie")}
                      >
                        <PieChart size={14} className="me-2" />
                        Tròn
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </div>

              <div className="d-flex align-items-center">
                {/* Custom Actions */}
                {actions && <div className="me-2">{actions}</div>}

                {/* Settings Dropdown */}
                {customizable && chartId && (
                  <Dropdown className="me-2">
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      size="sm"
                      className="border-0"
                    >
                      <Settings size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={handleToggleGrid}>
                        {chartConfig?.showGrid ? "Ẩn lưới" : "Hiện lưới"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleToggleLegend}>
                        {chartConfig?.showLegend
                          ? "Ẩn chú thích"
                          : "Hiện chú thích"}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item>
                        <Download size={14} className="me-2" />
                        Xuất biểu đồ
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}

                {/* Collapse Toggle */}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="border-0"
                >
                  {isCollapsed ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="col-12">
            {/* Quick Settings Bar */}
            {!isCollapsed && customizable && chartConfig && chartId && (
              <div className="mt-2 pt-2 border-top">
                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <small className="text-muted me-2">Tùy chỉnh:</small>

                  <Form.Check
                    type="switch"
                    id={`grid-${chartId}`}
                    label="Lưới"
                    checked={chartConfig.showGrid || false}
                    onChange={handleToggleGrid}
                    className="small"
                  />

                  <Form.Check
                    type="switch"
                    id={`legend-${chartId}`}
                    label="Chú thích"
                    checked={chartConfig.showLegend || false}
                    onChange={handleToggleLegend}
                    className="small"
                  />

                  {chartConfig.type === "line" && (
                    <Form.Check
                      type="switch"
                      id={`smooth-${chartId}`}
                      label="Làm mượt"
                      checked={chartConfig.smooth || false}
                      onChange={() =>
                        onConfigChange(chartId, {
                          smooth: !chartConfig.smooth,
                        })
                      }
                      className="small"
                    />
                  )}

                  {chartConfig.type === "bar" && (
                    <Form.Check
                      type="switch"
                      id={`stacked-${chartId}`}
                      label="Xếp chồng"
                      checked={chartConfig.stacked || false}
                      onChange={() =>
                        onConfigChange(chartId, {
                          stacked: !chartConfig.stacked,
                        })
                      }
                      className="small"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card.Header>

      {!isCollapsed && (!chartConfig || chartConfig?.visible !== false) && (
        <Card.Body className="pt-0">{children}</Card.Body>
      )}
    </Card>
  );
};

export default ChartContainer;
