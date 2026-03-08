import React, { useState } from "react";
import "../styles/theme.css";

function ViewToggle({ items, renderList, renderGrid }) {
  const [view, setView] = useState("list");

  return (
    <div className="view-toggle-container">
      {/* Right-hand style toggle */}
      <div className="view-toggle-buttons">
        <button
          className={`toggle-btn ${view === "list" ? "active-green" : "inactive-grey"}`}
          onClick={() => setView("list")}
        >
          📋 List
        </button>
        <button
          className={`toggle-btn ${view === "grid" ? "active-green" : "inactive-grey"}`}
          onClick={() => setView("grid")}
        >
          🗂 Grid
        </button>
      </div>

      {/* Render based on view */}
      {view === "list" ? renderList(items) : renderGrid(items)}
    </div>
  );
}

export default ViewToggle;
