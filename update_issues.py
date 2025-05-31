#!/usr/bin/env python3
"""
update_issues.py

Reads a GitHub-exported TSV whose columns are:

    Title    URL    Assignees    Status    Priority    Estimate    Size    Sprint

and rewrites ISSUES.md so that:
  1. Everything up through the second '---' in ISSUES.md (the Completed/Closed section)
     is left unchanged.
  2. Rows in the TSV whose Status != "Done" (case-insensitive) are treated as "open" issues,
     grouped by their 'Sprint' value, and appended under new "Sprint <name>" headings.
  3. Each open issue is rendered as:
       Issue #<number> – <title> – Priority <priority> – Sprint <sprint> – <status>
     where <number> is taken from the final segment of the URL (e.g. .../issues/68),
     <priority> is exactly what's in the TSV's Priority column, and <status> is what's
     in the TSV's Status column.

Usage:
    python update_issues.py path/to/issues.tsv path/to/ISSUES.md

If your TSV uses different header-names, change the COL_* constants below.
"""

import csv
import sys
import re
from collections import defaultdict


# ─── CONFIG: adjust these if your TSV uses different column-headers ───────────────────

# The exact header in your TSV that holds the issue title.
COL_TITLE    = "Title"

# The exact header in your TSV that holds the issue URL (e.g., ".../issues/68").
COL_URL      = "URL"

# The exact header in your TSV that holds statuses like "In progress", "Done", "Ready", "Backlog".
COL_STATUS   = "Status"

# The exact header in your TSV that holds Priority values (e.g., "A", "B", "C", etc.).
COL_PRIORITY = "Priority"

# The exact header in your TSV that holds the sprint (e.g., "Sprint 1", "Sprint 2", or blank).
COL_SPRINT   = "Sprint"

# ────────────────────────────────────────────────────────────────────────────────────────


def extract_issue_number(url):
    """
    Given a full GitHub issue URL like "https://github.com/.../issues/68",
    extract and return the trailing number as a string ("68").
    If no number found, returns an empty string.
    """
    if not url:
        return ""
    # Strip any trailing slash, then take the part after the last '/'
    trimmed = url.rstrip("/")
    last_part = trimmed.split("/")[-1]
    # Ensure it's all digits
    return last_part if last_part.isdigit() else ""


def read_tsv(path_to_tsv):
    """
    Reads the TSV file and returns a list of dicts, one per row.
    Only returns rows where State != "Done" (case-insensitive), treating those as "open".
    """
    open_issues = []
    with open(path_to_tsv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            status = row.get(COL_STATUS, "").strip().lower()
            # Treat exactly "done" (case-insensitive) as closed; everything else is open.
            if status != "done":
                open_issues.append(row)
    return open_issues


def group_by_sprint(open_issues):
    """
    Groups issues by sprint. Returns a dict:
       { sprint_name (str or "Backlog"): [list_of_issue_dicts], ... }

    If an issue has no Sprint (empty string), it is placed under "Backlog".
    """
    groups = defaultdict(list)
    for issue in open_issues:
        sprint = issue.get(COL_SPRINT, "").strip()
        if sprint == "":
            sprint = "Backlog"
        groups[sprint].append(issue)
    return groups


def format_issue_line(issue_row):
    """
    Produces a single formatted line for one open issue dict:
      Issue #<number> – <title> – Priority <priority> – Sprint <sprint> – <status>
    """
    title     = issue_row.get(COL_TITLE, "").strip()
    url       = issue_row.get(COL_URL, "").strip()
    status    = issue_row.get(COL_STATUS, "").strip()
    priority  = issue_row.get(COL_PRIORITY, "").strip() or "None"
    sprint    = issue_row.get(COL_SPRINT, "").strip() or "Backlog"

    # Extract issue number from URL
    issue_num = extract_issue_number(url)

    return f"Issue #{issue_num} – {title} – Priority {priority} – Sprint {sprint} – {status}"


def read_existing_issues_md(path_to_md):
    """
    Reads ISSUES.md into a list of lines.
    """
    with open(path_to_md, "r", encoding="utf-8") as f:
        return f.readlines()


def write_issues_md(path_to_md, lines):
    """
    Overwrites ISSUES.md with the given list of lines.
    """
    with open(path_to_md, "w", encoding="utf-8") as f:
        f.write("".join(lines))


def find_end_of_completed_section(lines):
    """
    In ISSUES.md, we expect two '---' separators:
      1) Right under the "# Project Issues" heading
      2) Right after the Completed / Closed Issues list

    We want to preserve everything up through that second '---', so we can append
    our newly generated open-issue sections afterwards.

    Returns the index (0-based) of the line that is the second '---'.
    If fewer than two '---' lines are found, exits with an error.
    """
    sep_indices = [i for i, line in enumerate(lines) if line.strip() == "---"]
    if len(sep_indices) < 2:
        print("Error: Could not find two '---' separators in ISSUES.md.")
        sys.exit(1)
    # Return the index of the second '---'
    return sep_indices[1]


def generate_new_open_sections(grouped):
    """
    Given a dict { sprint_name: [issue_dicts, ...], ... }, generate
    the block of lines that list open issues, grouped by sprint.
    Returns a list of lines, each ending with a newline.
    """
    out_lines = []

    # Sort sprints so that "Sprint N" (where N is a number) appear numerically,
    # followed by "Backlog", then any other names alphabetically.
    def sprint_sort_key(sprint_name):
        lower = sprint_name.lower()
        m = re.match(r"sprint\s*(\d+)", lower)
        if m:
            return (0, int(m.group(1)))    # e.g. "Sprint 2" → (0, 2)
        if lower == "backlog":
            return (1, 0)
        return (2, lower)

    for sprint_name in sorted(grouped.keys(), key=sprint_sort_key):
        issues = grouped[sprint_name]
        if not issues:
            continue

        # Write the "Sprint <sprint_name>" heading
        out_lines.append(f"Sprint {sprint_name}\n")

        # Sort issues by extracted issue number (as integer), fall back to title if parse fails
        def issue_number_key(r):
            num_str = extract_issue_number(r.get(COL_URL, "").strip())
            try:
                return int(num_str)
            except ValueError:
                return float("inf")

        issues_sorted = sorted(issues, key=issue_number_key)

        for issue in issues_sorted:
            out_lines.append(format_issue_line(issue) + "\n")
        out_lines.append("\n")  # blank line after each sprint block

    return out_lines


def main():
    if len(sys.argv) != 3:
        print("Usage: python update_issues.py path/to/issues.tsv path/to/ISSUES.md")
        sys.exit(1)

    path_tsv = sys.argv[1]
    path_md  = sys.argv[2]

    # 1) Read all open issues from the TSV (Status != "Done")
    open_issues = read_tsv(path_tsv)

    # 2) Group by sprint
    grouped = group_by_sprint(open_issues)

    # 3) Read existing ISSUES.md
    existing_lines = read_existing_issues_md(path_md)

    # 4) Find index of second '---' (end of Completed/Closed section)
    idx_end_completed = find_end_of_completed_section(existing_lines)

    # 5) Preserve everything up to and including that second '---'
    new_md_lines = existing_lines[: idx_end_completed + 1]

    # 6) Ensure there's a blank line before we append new open‐issue sections
    if not new_md_lines[-1].endswith("\n"):
        new_md_lines[-1] += "\n"
    new_md_lines.append("\n")

    # 7) Generate the new open‐issue blocks
    open_sections = generate_new_open_sections(grouped)

    # 8) Append those to the new file content
    new_md_lines.extend(open_sections)

    # 9) Overwrite ISSUES.md
    write_issues_md(path_md, new_md_lines)

    total_open = sum(len(v) for v in grouped.values())
    print(f"ISSUES.md updated: {total_open} open issue{'s' if total_open!=1 else ''} added.")


if __name__ == "__main__":
    main()
