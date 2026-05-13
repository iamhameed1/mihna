function IngestionLogsPage({ logs, onRefreshLogs }) {
  const totalRuns = logs.length;
  const successfulRuns = logs.filter((log) => log.status === "success").length;
  const failedRuns = logs.filter((log) => log.status === "failed").length;

  const totalAdded = logs.reduce((sum, log) => {
    return sum + log.added_count;
  }, 0);

  const totalSkipped = logs.reduce((sum, log) => {
    return sum + log.skipped_count;
  }, 0);

  return (
    <>
      <div className="page-title">
        <p>Data Pipeline</p>
        <h1>Ingestion Logs</h1>
        <span>Track external job imports and pipeline status.</span>
      </div>

      <div className="cards">
        <div className="card">
          <p>Total Runs</p>
          <h2>{totalRuns}</h2>
          <span>Pipeline executions</span>
        </div>

        <div className="card">
          <p>Successful Runs</p>
          <h2>{successfulRuns}</h2>
          <span>Completed imports</span>
        </div>

        <div className="card">
          <p>Failed Runs</p>
          <h2>{failedRuns}</h2>
          <span>Needs attention</span>
        </div>

        <div className="card">
          <p>Jobs Added</p>
          <h2>{totalAdded}</h2>
          <span>Total imported jobs</span>
        </div>
      </div>

      <div className="cards pipeline-extra-cards">
        <div className="card">
          <p>Duplicates Skipped</p>
          <h2>{totalSkipped}</h2>
          <span>Already existed in database</span>
        </div>
      </div>

      <div className="company-actions">
        <button className="submit-btn" onClick={onRefreshLogs}>
          Refresh Logs
        </button>
      </div>

      <div className="logs-table">
        {logs.length === 0 ? (
          <p className="empty-message">No ingestion logs yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Status</th>
                <th>Added</th>
                <th>Skipped</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Error</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.source}</td>
                  <td>
                    <span
                      className={
                        log.status === "success"
                          ? "status-pill success"
                          : log.status === "failed"
                          ? "status-pill failed"
                          : "status-pill running"
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                  <td>{log.added_count}</td>
                  <td>{log.skipped_count}</td>
                  <td>{new Date(log.started_at).toLocaleString()}</td>
                  <td>
                    {log.finished_at
                      ? new Date(log.finished_at).toLocaleString()
                      : "-"}
                  </td>
                  <td>{log.error_message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default IngestionLogsPage;