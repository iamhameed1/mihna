function IngestionLogsPage({ logs, onRefreshLogs }) {
  return (
    <>
      <div className="page-title">
        <p>Data Pipeline</p>
        <h1>Ingestion Logs</h1>
        <span>Track external job imports and pipeline status.</span>
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