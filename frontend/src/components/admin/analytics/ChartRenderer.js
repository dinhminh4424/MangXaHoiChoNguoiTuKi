// src/components/admin/analytics/ChartRenderer.js
import React from "react";
import InteractiveLineChart from "./charts/InteractiveLineChart";
import InteractiveBarChart from "./charts/InteractiveBarChart";
import InteractivePieChart from "./charts/InteractivePieChart";

const ChartRenderer = ({ chartId, data, config, height = 350 }) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height }}
      >
        <div className="text-center text-muted">
          <div className="mb-2">📊</div>
          <p>Không có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  }

  const chartProps = {
    data,
    metrics: config.metrics || ["count"],
    colors: config.colors || ["#0088FE"],
    config: {
      showGrid: config.showGrid !== false,
      showLegend: config.showLegend !== false,
      smooth: config.smooth || false,
      stacked: config.stacked || false,
      showLabels: config.showLabels !== false,
      showPercentages: config.showPercentages !== false,
    },
  };

  switch (config.type) {
    case "line":
      return (
        <InteractiveLineChart
          {...chartProps}
          config={{
            ...chartProps.config,
            smooth: config.smooth,
          }}
        />
      );

    case "bar":
      return (
        <InteractiveBarChart
          {...chartProps}
          config={{
            ...chartProps.config,
            stacked: config.stacked,
          }}
        />
      );

    case "pie":
      return (
        <InteractivePieChart
          {...chartProps}
          config={{
            ...chartProps.config,
            showLabels: config.showLabels,
            showPercentages: config.showPercentages,
          }}
          title={config.title}
        />
      );

    default:
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height }}
        >
          <div className="text-center text-warning">
            <div className="mb-2">⚠️</div>
            <p>Loại biểu đồ không được hỗ trợ</p>
          </div>
        </div>
      );
  }
};

export default ChartRenderer;
