// src/components/admin/analytics/FilterPanel.js
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Accordion,
  Badge,
  InputGroup,
  ButtonGroup,
} from "react-bootstrap";
import { Filter, X, Calendar, Save } from "lucide-react";

const EnhancedFilterPanel = ({
  filters,
  onFiltersChange,
  onReset,
  availableMetrics = [],
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [savedPresets, setSavedPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);

  // Khởi tạo filters từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("analyticsFilterPresets");
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value,
      lastUpdated: new Date().toISOString(),
    };
    setLocalFilters(newFilters);
  };

  const handleRangeChange = (key, subKey, value) => {
    const newFilters = {
      ...localFilters,
      [key]: {
        ...localFilters[key],
        [subKey]: value,
      },
    };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    setActivePreset(null);
    onReset();
  };

  const savePreset = () => {
    const presetName = prompt("Đặt tên cho bộ lọc:");
    if (presetName && Object.keys(localFilters).length > 0) {
      const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        filters: { ...localFilters },
        createdAt: new Date().toISOString(),
      };

      const updatedPresets = [...savedPresets, newPreset];
      setSavedPresets(updatedPresets);
      localStorage.setItem(
        "analyticsFilterPresets",
        JSON.stringify(updatedPresets)
      );
    }
  };

  const loadPreset = (preset) => {
    setLocalFilters(preset.filters);
    setActivePreset(preset.id);
    onFiltersChange(preset.filters);
  };

  const deletePreset = (presetId, e) => {
    e.stopPropagation();
    const updatedPresets = savedPresets.filter((p) => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem(
      "analyticsFilterPresets",
      JSON.stringify(updatedPresets)
    );

    if (activePreset === presetId) {
      setActivePreset(null);
      resetFilters();
    }
  };

  const getActiveFilterCount = () => {
    return Object.keys(localFilters).filter(
      (key) =>
        key !== "lastUpdated" &&
        localFilters[key] !== undefined &&
        localFilters[key] !== ""
    ).length;
  };

  // Hàm tính toán ngày bắt đầu dựa trên period
  const getStartDateByPeriod = (period) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    return startDate.toISOString().split("T")[0];
  };

  // Hàm xử lý khi chọn period nhanh
  const handleQuickPeriodSelect = (periodValue) => {
    const startDate = getStartDateByPeriod(periodValue);
    const endDate = new Date().toISOString().split("T")[0]; // Ngày hiện tại

    const newFilters = {
      ...localFilters,
      period: periodValue,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Các period options
  const periodOptions = [
    { label: "HN", value: "today", color: "primary" },
    { label: "7N", value: "week", color: "info" },
    { label: "1T", value: "month", color: "success" },
    { label: "1N", value: "year", color: "warning" },
  ];

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-transparent border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Filter size={18} className="me-2 text-primary" />
            <h6 className="mb-0 fw-semibold">Bộ Lọc Thời Gian</h6>
            {getActiveFilterCount() > 0 && (
              <Badge bg="primary" className="ms-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </div>
          <div className="d-flex gap-1">
            {/* <Button
              variant="outline-primary"
              size="sm"
              onClick={savePreset}
              disabled={Object.keys(localFilters).length === 0}
            >
              <Save size={14} />
            </Button> */}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={resetFilters}
              disabled={Object.keys(localFilters).length === 0}
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <div className="mt-2">
            <small className="text-muted d-block mb-1">Bộ lọc đã lưu:</small>
            <div className="d-flex flex-wrap gap-1">
              {savedPresets.map((preset) => (
                <Badge
                  key={preset.id}
                  bg={
                    activePreset === preset.id ? "primary" : "outline-primary"
                  }
                  className="cursor-pointer"
                  onClick={() => loadPreset(preset)}
                >
                  {preset.name}
                  <X
                    size={10}
                    className="ms-1"
                    onClick={(e) => deletePreset(preset.id, e)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card.Header>

      <Card.Body className="overflow-auto">
        {/* Tab buttons cho period nhanh */}
        <div className="mb-4">
          <small className="text-muted d-block mb-2 fw-semibold">
            Chọn nhanh:
          </small>
          <ButtonGroup className="w-100">
            {periodOptions.map((period) => (
              <Button
                key={period.value}
                variant={
                  localFilters.period === period.value
                    ? period.color
                    : `outline-${period.color}`
                }
                size="sm"
                onClick={() => handleQuickPeriodSelect(period.value)}
                className="flex-fw"
              >
                {period.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <Accordion defaultActiveKey="0" alwaysOpen>
          {/* Date Range Filters */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <Calendar size={16} className="me-2" />
              Khoảng Thời Gian Tùy Chỉnh
            </Accordion.Header>
            <Accordion.Body>
              <Row className="g-2">
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      Từ ngày
                    </Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={localFilters.dateRange?.start || ""}
                      onChange={(e) =>
                        handleRangeChange("dateRange", "start", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      Đến ngày
                    </Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={localFilters.dateRange?.end || ""}
                      onChange={(e) =>
                        handleRangeChange("dateRange", "end", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Hiển thị period hiện tại */}
              {localFilters.period && (
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted d-block">Đang chọn:</small>
                  <div className="d-flex align-items-center">
                    <Badge
                      bg={
                        periodOptions.find(
                          (p) => p.value === localFilters.period
                        )?.color
                      }
                      className="me-2"
                    >
                      {
                        periodOptions.find(
                          (p) => p.value === localFilters.period
                        )?.label
                      }
                    </Badge>
                    <small>
                      {localFilters.dateRange?.start &&
                        localFilters.dateRange?.end &&
                        `${new Date(
                          localFilters.dateRange.start
                        ).toLocaleDateString("vi-VN")} - ${new Date(
                          localFilters.dateRange.end
                        ).toLocaleDateString("vi-VN")}`}
                    </small>
                  </div>
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="mt-3 sticky-bottom bg-white pt-2 border-top">
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={applyFilters}
              className="flex-fw"
            >
              Áp dụng Bộ Lọc
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={resetFilters}
              disabled={Object.keys(localFilters).length === 0}
            >
              Đặt lại
            </Button>
          </div>

          {getActiveFilterCount() > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                Đang áp dụng {getActiveFilterCount()} bộ lọc
              </small>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default EnhancedFilterPanel;
