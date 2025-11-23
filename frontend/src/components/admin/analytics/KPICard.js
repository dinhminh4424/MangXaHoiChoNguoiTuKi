// src/components/admin/analytics/KPICard.js
import React, { useState } from "react";
import {
  Card,
  Badge,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Info,
  Download,
  RefreshCw,
} from "lucide-react";

const KPICard = ({
  title,
  value,
  trend,
  total,
  icon: Icon,
  color = "primary",
  description,
  onExport,
  onRefresh,
  compact = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTrendIcon = () => {
    if (trend === undefined || trend === null)
      return <Minus size={14} className="text-muted" />;
    if (trend > 0) return <TrendingUp size={14} className="text-success" />;
    return <TrendingDown size={14} className="text-danger" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return "secondary";
    return trend > 0 ? "success" : "danger";
  };

  const getTrendText = () => {
    if (trend === undefined || trend === null) return "Không có dữ liệu";
    return `${Math.abs(trend)}% so với kỳ trước`;
  };

  const formatValue = (val) => {
    if (typeof val === "number") {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card
      className={`h-100 shadow-sm border-0 transition-all ${
        isHovered ? "shadow" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        transition: "all 0.3s ease",
      }}
    >
      <Card.Body className="p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div className={`bg-${color} bg-opacity-10 rounded p-2 me-2`}>
              <Icon size={compact ? 18 : 20} className={`text-${color}`} />
            </div>
            <div>
              <h6 className={`mb-0 fw-semibold ${compact ? "small" : ""}`}>
                {title}
              </h6>
              {description && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>{description}</Tooltip>}
                >
                  <Info size={12} className="text-muted ms-1 cursor-pointer" />
                </OverlayTrigger>
              )}
            </div>
          </div>

          <Dropdown>
            <Dropdown.Toggle
              variant="outline-light"
              size="sm"
              className="border-0 p-1"
            >
              <MoreVertical size={14} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={onRefresh}>
                <RefreshCw size={14} className="me-2" />
                Làm mới
              </Dropdown.Item>
              <Dropdown.Item onClick={onExport}>
                <Download size={14} className="me-2" />
                Xuất dữ liệu
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3 className={`mb-1 fw-bold text-${color} ${compact ? "h4" : ""}`}>
            {formatValue(value)}
          </h3>
          {total !== undefined && total !== null && (
            <small className="text-muted">
              Tổng: <strong>{formatValue(total)}</strong>
            </small>
          )}
        </div>

        {/* Trend */}
        <div className="d-flex justify-content-between align-items-center">
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{getTrendText()}</Tooltip>}
          >
            <Badge
              bg={getTrendColor()}
              className="d-flex align-items-center px-2 py-1"
            >
              {getTrendIcon()}
              <span className="ms-1 fw-normal">
                {trend !== undefined && trend !== null
                  ? `${Math.abs(trend)}%`
                  : "N/A"}
              </span>
            </Badge>
          </OverlayTrigger>

          {isHovered && <small className="text-muted">{getTrendText()}</small>}
        </div>
      </Card.Body>
    </Card>
  );
};

export default KPICard;
