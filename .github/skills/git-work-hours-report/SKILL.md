---
name: git-work-hours-report
description: "Generate a reusable work-hours report from git history since a user-provided start time. Produces CSV and formatted XLSX outputs with date, estimated working hours, and commit times."
argument-hint: "Provide a start datetime, e.g. 2026-07-19 00:00:00"
---

# Git Work Hours Report

Generate a per-day work report from git commit timestamps starting from a user-provided datetime.

## What This Skill Produces

- CSV report with columns:
  - `date`
  - `working_hours`
  - `commit_times`
- Formatted XLSX report with:
  - title/header styling
  - alternating row colors
  - total hours row
  - frozen header and filters

## Input Required

- Start datetime for git history, such as `2026-07-19 00:00:00`

## Core Command

Run from repo root:

```bash
python3 "working hours report/work_hours_report.py" --since "2026-07-19 00:00:00"
```

## Useful Variations

Use custom output names:

```bash
python3 "working hours report/work_hours_report.py" \
  --since "2026-07-19 00:00:00" \
  --csv "work-hours-since-19-07.csv" \
  --xlsx "work-hours-since-19-07.xlsx"
```

Adjust estimation model (hours per commit):

```bash
python3 "working hours report/work_hours_report.py" \
  --since "2026-07-19 00:00:00" \
  --hours-per-commit 0.75
```

CSV only:

```bash
python3 "working hours report/work_hours_report.py" \
  --since "2026-07-19 00:00:00" \
  --skip-xlsx
```

## Notes

- Git does not store remote push timestamps in standard history. This report uses commit timestamps as the timing source.
- XLSX generation requires `openpyxl`:

```bash
python3 -m pip install --user openpyxl
```
