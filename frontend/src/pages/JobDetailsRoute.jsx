import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getJobById } from "@/services/api";
import JobDetailsPage from "./JobDetailsPage";

export default function JobDetailsRoute(props) {
  useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const validId = /^[1-9][0-9]*$/.test(id);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    getJobById(id, controller.signal).then(
      (job) => {
        if (!controller.signal.aborted) setResult({ key: location.key, id, retry, job });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key: location.key, id, retry, error: error.message });
      },
    );
    return () => controller.abort();
  }, [id, location.key, retry, validId]);

  function backToJobs() {
    if (location.state?.from) navigate(-1);
    else navigate("/", { replace: true });
  }

  if (!validId) return <Navigate to="/" replace />;
  if (!result || result.key !== location.key || result.id !== id || result.retry !== retry) {
    return <p role="status" className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{t("Loading job details...")}</p>;
  }
  if (result.error) {
    return <div className="space-y-4 rounded-xl border bg-card p-5">
      <p role="alert" className="text-sm text-destructive">{result.error}</p>
      <div className="flex gap-2">
        <Button onClick={() => setRetry((value) => value + 1)}>{t("Retry")}</Button>
        <Button variant="outline" onClick={backToJobs}>{t("Back to jobs")}</Button>
      </div>
    </div>;
  }
  return <JobDetailsPage {...props} job={result.job} onBack={backToJobs}
    onDeleteJob={async (jobId) => {
      if (await props.onDeleteJob(jobId)) navigate("/", { replace: true });
    }} />;
}
