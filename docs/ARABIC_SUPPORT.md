# Arabic and English interface support

Mihna localizes the application interface only.
Job titles, descriptions, company names, and other job-posting content remain in their original language.

## Interface architecture

React uses i18next and react-i18next with the English and Arabic catalogs in
`frontend/src/locales`. The language switcher persists `mihna_language` in local
storage. English sets `<html lang="en" dir="ltr">`; Arabic sets
`<html lang="ar" dir="rtl">`. Navigation, buttons, forms, filters, validation,
dashboard/analytics labels, and localized dates/numbers remain supported.

Job cards, details, saved/company listings and analytics previews use `title`
and `description` directly, regardless of interface language. Dynamic titles
and descriptions use automatic text direction (or bidi isolation in analytics),
so English and Arabic original postings both render naturally inside either UI.
Existing preview truncation and description formatting remain in place.
No database job title or description is passed to i18next.

## Backend and stored data

FastAPI returns original job fields. Search uses the original title, description
and company with existing filters, sorting and pagination. Jobs CSV exports
original content, including description, without legacy localization columns.
Company creation and editing save submitted content without translation calls.
Remotive ingestion retains normalization, HTML cleaning, deduplication, source
tracking and ingestion logs, with no machine translation step.

Migration `d83b1a092e65` is historical and remains unchanged. Job runtime models
and API responses use only the original title and description fields. No job
translation columns are required, and no downgrade or database cleanup was
performed.

The general backend environment loader and Docker ignore rules remain useful
independently of localization. Requests remains necessary for external ingestion.
No translation provider, background backfill, or translation Docker integration
is required.

## Optional local cleanup

Real environment files were not modified. You may remove the unused
`TRANSLATION_PROVIDER`, `TRANSLATION_API_URL`, `TRANSLATION_API_KEY` and
`TRANSLATION_TIMEOUT_SECONDS` entries from your real `.env` files.
Restart/rebuild the application normally to load updated code; the standard
Mihna Compose configuration is sufficient.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` from `frontend`, and `python -m unittest discover -s tests -v` from `backend`. The suites cover language persistence/switching, RTL, original-language content, navigation, roles, filters, and ingestion. PostgreSQL-specific tests require a dedicated `MIHNA_TEST_DATABASE_URL`.

See [CLEANUP_REPORT.md](CLEANUP_REPORT.md) for the latest recorded cleanup validation. Real Google/inbox delivery and browser visual checks require the appropriate connected services.
