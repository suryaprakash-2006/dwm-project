import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem("dwm_entries")) || [];
    // Group by status (Present, Leave, OD)
    const statusTotals = {};
    savedEntries.forEach((entry) => {
      const status = entry.status || "P";
      statusTotals[status] = (statusTotals[status] || 0) + 1;
    });

    setChartData({
      labels: Object.keys(statusTotals),
      datasets: [
        {
          label: "Shift Distribution",
          data: Object.values(statusTotals),
          backgroundColor: ["#2563EB", "#1D4ED8", "#60A5FA"],
        },
      ],
    });
  }, []);

  const options = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;
