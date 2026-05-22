from datetime import datetime, timedelta, timezone

from bs4 import BeautifulSoup

import models


def clean_html(raw_html: str) -> str:
    if not raw_html:
        return "No description available."

    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup(["script", "style", "img"]):
        tag.decompose()

    text = soup.get_text(separator="\n")

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    return "\n".join(lines)


def apply_job_filters(
    query,
    search: str | None = None,
    type: str | None = None,
    location: str | None = None,
    source: str | None = None,
    date_range: str | None = None,
):
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (models.Job.title.ilike(search_value)) |
            (models.Job.company.ilike(search_value)) |
            (models.Job.description.ilike(search_value))
        )

    if type and type != "All":
        query = query.filter(models.Job.type == type)

    if location and location != "All":
        location_value = f"%{location}%"

        query = query.filter(
            (models.Job.country.ilike(location_value)) |
            (models.Job.city.ilike(location_value))
        )

    if source and source != "All":
        if source == "manual":
            query = query.filter(models.Job.source.is_(None))
        else:
            query = query.filter(models.Job.source == source)

    if date_range and date_range != "All":
        now = datetime.now(timezone.utc)

        if date_range == "7d":
            start_date = now - timedelta(days=7)
            query = query.filter(models.Job.created_at >= start_date)

        elif date_range == "30d":
            start_date = now - timedelta(days=30)
            query = query.filter(models.Job.created_at >= start_date)

    return query