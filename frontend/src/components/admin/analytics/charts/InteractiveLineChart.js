// src/components/admin/analytics/charts/InteractiveLineChart.js
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const InteractiveLineChart = ({
  data,
  metrics = ["count"],
  colors = ["#0088FE"],
  config = {},
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="mb-2">📊</div>
        <p>Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-dark text-white p-3 rounded shadow">
          <p className="mb-1 fw-semibold">{`Ngày: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-0" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        {config.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        )}

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={60}
          interval="preserveStartEnd"
        />

        <YAxis tick={{ fontSize: 11 }} width={80} />

        <Tooltip content={<CustomTooltip />} />

        {config.showLegend && (
          <Legend verticalAlign="top" height={36} iconType="circle" />
        )}

        {metrics.map((metric, index) => (
          <Line
            key={metric}
            type={config.smooth ? "monotone" : "linear"}
            dataKey={metric}
            name={metric}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default InteractiveLineChart;
