  import React from "react";

  const DownloadButtons = () => {
    return (
      <div className="mt-4 d-flex flex-wrap gap-2">
        <button className="btn btn-outline-primary">Download Daily Employee Report</button>
        <button className="btn btn-outline-primary">Download Daily Department Report</button>
        <button className="btn btn-outline-primary">Download Monthly Reports</button>
      </div>
    );
  };

  export default DownloadButtons;
