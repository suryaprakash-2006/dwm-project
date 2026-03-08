import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

const Analytics = () => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem("dwm_entries")) || [];
    setEntries(savedEntries);
  }, []);

  // Total hours worked
  const totalHours = entries.reduce((acc, e) => acc + e.hours, 0);

  // Department distribution
  const deptCounts = entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  const deptData = {
    labels: Object.keys(deptCounts),
    datasets: [
      {
        label: "Entries per Department",
        data: Object.values(deptCounts),
        backgroundColor: ["#2563EB", "#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  // Machine usage distribution
  const machineCounts = entries.reduce((acc, e) => {
    acc[e.machine] = (acc[e.machine] || 0) + 1;
    return acc;
  }, {});
  const machineData = {
    labels: Object.keys(machineCounts),
    datasets: [
      {
        data: Object.values(machineCounts),
        backgroundColor: ["#2563EB", "#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  // Hours trend over time
  const hoursTrendData = {
    labels: entries.map((e) => e.date),
    datasets: [
      {
        label: "Work Hours Trend",
        data: entries.map((e) => e.hours),
        borderColor: "#2563EB",
        fill: false,
      },
    ],
  };

  return (
    <div className="page">
      <h3>Analytics Dashboard</h3>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Total Hours</h6>
            <h4>{totalHours}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Departments</h6>
            <h4>{Object.keys(deptCounts).length}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Machines Used</h6>
            <h4>{Object.keys(machineCounts).length}</h4>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3">
            <Bar data={deptData} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <Pie data={machineData} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="card p-3">
            <Line data={hoursTrendData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
