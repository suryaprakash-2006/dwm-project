import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const LineChart = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem("dwm_entries")) || [];
    // Group by date
    const dateTotals = {};
    savedEntries.forEach((entry) => {
      dateTotals[entry.date] = (dateTotals[entry.date] || 0) + entry.hours;
    });

    setChartData({
      labels: Object.keys(dateTotals),
      datasets: [
        {
          label: "Hours Logged",
          data: Object.values(dateTotals),
          borderColor: "#2563EB",
          backgroundColor: "#2563EB",
          tension: 0.3,
        },
      ],
    });
  }, []);

  const options = {
    responsive: true,
    plugins: { legend: { display: true } },
  };

  return <Line data={chartData} options={options} />;
};

export default LineChart;
