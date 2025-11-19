// src/components/admin/analytics/charts/InteractiveBarChart.js
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const InteractiveBarChart = ({
  data,
  metrics = ["count"],
  colors = ["#00C49F"],
  config = {},
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="mb-2">📈</div>
        <p>Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-dark text-white p-3 rounded shadow">
          <p className="mb-1 fw-semibold">{`Tuần: ${label}`}</p>
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
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        {config.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        )}

        <XAxis
          dataKey="week"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />

        <YAxis tick={{ fontSize: 11 }} width={80} />

        <Tooltip content={<CustomTooltip />} />

        {config.showLegend && <Legend verticalAlign="top" height={36} />}

        {metrics.map((metric, index) => (
          <Bar
            key={metric}
            dataKey={metric}
            name={metric}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            stackId={config.stacked ? "stack" : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default InteractiveBarChart;
