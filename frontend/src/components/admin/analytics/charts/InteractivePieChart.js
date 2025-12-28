// src/components/admin/analytics/charts/InteractivePieChart.js
import React, { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";
import {
  Card,
  Form,
  ButtonGroup,
  Button,
  OverlayTrigger,
  Tooltip as BSTooltip,
} from "react-bootstrap";
import { Download, Filter, Eye, EyeOff, RotateCcw } from "lucide-react";

// Color palette chuyên nghiệp
const COLOR_PALETTES = {
  default: [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
  ],
  pastel: [
    "#A3D9FF",
    "#96E6B3",
    "#FFE066",
    "#FFA94D",
    "#C9AFFF",
    "#8CE0B3",
    "#FF9AA2",
    "#77DD77",
    "#FDFD96",
    "#84B6F4",
    "#FDCAE1",
    "#B39EB5",
    "#FFB347",
    "#B5EAD7",
    "#C7CEEA",
    "#E2F0CB",
    "#FFDAC1",
    "#B5EAD7",
  ],
  vibrant: [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#10AC84",
  ],
};

const InteractivePieChart = ({
  data,
  metrics = ["count"],
  config = {},
  onConfigChange,
  title = "Biểu đồ phân bố",
}) => {
  // Tất cả hooks phải được gọi ở đây - không được gọi sau điều kiện return
  const [activeIndex, setActiveIndex] = useState(null);
  const [hiddenSegments, setHiddenSegments] = useState(new Set());
  const [colorPalette, setColorPalette] = useState("default");
  const [showPercentage, setShowPercentage] = useState(
    config.showPercentages !== false
  );
  const [showLabels, setShowLabels] = useState(config.showLabels !== false);
  const [innerRadius, setInnerRadius] = useState(0);

  // Toggle ẩn/hiện segment - useCallback phải được định nghĩa ở đây
  const toggleSegmentVisibility = useCallback((index) => {
    setHiddenSegments((prev) => {
      const newHidden = new Set(prev);
      if (newHidden.has(index)) {
        newHidden.delete(index);
      } else {
        newHidden.add(index);
      }
      return newHidden;
    });
  }, []);

  // Hiện tất cả segments
  const showAllSegments = useCallback(() => {
    setHiddenSegments(new Set());
  }, []);

  // Ẩn tất cả segments trừ cái được chọn
  const isolateSegment = useCallback(
    (index) => {
      if (!data) return;
      const allIndices = new Set(data.map((_, idx) => idx));
      allIndices.delete(index);
      setHiddenSegments(allIndices);
    },
    [data]
  );

  // Export chart as PNG
  const exportChart = useCallback(() => {
    const svg = document.querySelector(".recharts-wrapper");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${title
          .toLowerCase()
          .replace(/\s+/g, "-")}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  }, [title]);

  // Xử lý sự kiện click trên segment
  const onPieClick = useCallback(
    (data, index) => {
      if (data && data.activePayload) {
        const clickedIndex = data.activePayload[0].payload.index;
        isolateSegment(clickedIndex);
      }
    },
    [isolateSegment]
  );

  // Xử lý sự kiện hover trên segment
  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Kiểm tra dữ liệu - phải đứng sau tất cả hooks
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="mb-2">🥧</div>
        <p>Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  // Filter data based on hidden segments
  const filteredData = data.filter((item, index) => !hiddenSegments.has(index));
  const totalValue = filteredData.reduce(
    (sum, item) => sum + (item[metrics[0]] || 0),
    0
  );

  // Custom active shape khi hover
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data[metrics[0]];
      const percentage =
        totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;

      return (
        <div className="custom-tooltip bg-dark text-white p-3 rounded shadow-lg border-0">
          <p className="fw-semibold mb-1">
            {data.reason || data.name || "Không có tên"}
          </p>
          <p className="mb-0">
            <strong>Giá trị:</strong> {value.toLocaleString()}
          </p>
          <p className="mb-0">
            <strong>Tỷ lệ:</strong> {percentage}%
          </p>
          {data.description && (
            <p className="mb-0 mt-1 small">
              <em>{data.description}</em>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom legend với toggle visibility
  const renderLegend = (props) => {
    const { payload } = props;

    return (
      <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
        {payload.map((entry, index) => {
          const isHidden = hiddenSegments.has(index);

          return (
            <div
              key={`legend-${index}`}
              className="d-flex align-items-center me-3 mb-1 cursor-pointer"
              onClick={() => toggleSegmentVisibility(index)}
              style={{
                opacity: isHidden ? 0.4 : 1,
                transition: "all 0.3s ease",
              }}
            >
              <div
                className="legend-color me-2 rounded"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: isHidden ? "#ccc" : entry.color,
                  transition: "all 0.3s ease",
                }}
              />
              <span
                className="small"
                style={{
                  textDecoration: isHidden ? "line-through" : "none",
                  color: isHidden ? "#6c757d" : "inherit",
                }}
              >
                {entry.value}
              </span>
              <OverlayTrigger
                placement="top"
                overlay={<BSTooltip>{isHidden ? "Hiện" : "Ẩn"}</BSTooltip>}
              >
                <span className="ms-1">
                  {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                </span>
              </OverlayTrigger>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom label với percentage
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    if (!showLabels && !showPercentage) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    // Chỉ hiển thị label cho các segment đủ lớn
    if (percent < 0.03) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={2}
        paintOrder="stroke"
      >
        {showLabels && name && name.length > 10
          ? `${name.substring(0, 10)}...`
          : name}
        {showLabels && showPercentage && " "}
        {showPercentage && `(${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="interactive-pie-chart">
      {/* Control Panel */}
      {/* <Card className="mb-3 border-0">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-semibold">Tùy chỉnh:</small>

              <Form.Check
                type="switch"
                id="show-percentages"
                label="Phần trăm"
                checked={showPercentage}
                onChange={(e) => setShowPercentage(e.target.checked)}
                className="small"
              />

              <Form.Check
                type="switch"
                id="show-labels"
                label="Nhãn"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="small"
              />

              <Form.Check
                type="switch"
                id="donut-mode"
                label="Donut"
                checked={innerRadius > 0}
                onChange={(e) => setInnerRadius(e.target.checked ? 50 : 0)}
                className="small"
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-semibold">Màu sắc:</small>

              <ButtonGroup size="sm">
                <Button
                  variant={
                    colorPalette === "default" ? "primary" : "outline-primary"
                  }
                  onClick={() => setColorPalette("default")}
                >
                  Mặc định
                </Button>
                <Button
                  variant={
                    colorPalette === "pastel" ? "primary" : "outline-primary"
                  }
                  onClick={() => setColorPalette("pastel")}
                >
                  Pastel
                </Button>
                <Button
                  variant={
                    colorPalette === "vibrant" ? "primary" : "outline-primary"
                  }
                  onClick={() => setColorPalette("vibrant")}
                >
                  Rực rỡ
                </Button>
              </ButtonGroup>

              <OverlayTrigger
                placement="top"
                overlay={<BSTooltip>Hiện tất cả</BSTooltip>}
              >
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={showAllSegments}
                  disabled={hiddenSegments.size === 0}
                >
                  <RotateCcw size={14} />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={<BSTooltip>Tải xuống ảnh</BSTooltip>}
              >
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={exportChart}
                >
                  <Download size={14} />
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </Card.Body>
      </Card> */}

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={filteredData.map((item, index) => ({ ...item, index }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            innerRadius={innerRadius}
            outerRadius={120}
            dataKey={metrics[0]}
            nameKey="reason"
            onClick={onPieClick}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            isAnimationActive={true}
            animationDuration={500}
            animationBegin={0}
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  COLOR_PALETTES[colorPalette][
                    index % COLOR_PALETTES[colorPalette].length
                  ]
                }
                stroke="#fff"
                strokeWidth={2}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <Card className="mt-3 border-0 bg-light">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center text-center">
            <div>
              <small className="text-muted d-block">Tổng số segment</small>
              <strong>{filteredData.length}</strong>
            </div>
            <div>
              <small className="text-muted d-block">Tổng giá trị</small>
              <strong>{totalValue.toLocaleString()}</strong>
            </div>
            <div>
              <small className="text-muted d-block">Đang ẩn</small>
              <strong
                className={
                  hiddenSegments.size > 0 ? "text-warning" : "text-success"
                }
              >
                {hiddenSegments.size}
              </strong>
            </div>
            <div>
              <small className="text-muted d-block">Segment lớn nhất</small>
              <strong>
                {filteredData.length > 0
                  ? Math.max(
                      ...filteredData.map((item) => item[metrics[0]])
                    ).toLocaleString()
                  : 0}
              </strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      {filteredData.length > 0 && (
        <div className="mt-3 text-center">
          <small className="text-muted">
            💡 <strong>Mẹo:</strong> Click vào segment để xem riêng • Hover để
            phóng to • Click legend để ẩn/hiện
          </small>
        </div>
      )}
    </div>
  );
};

export default InteractivePieChart;
