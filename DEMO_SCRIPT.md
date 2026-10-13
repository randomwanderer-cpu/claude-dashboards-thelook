# Demo script: about 90 seconds

Goal: show that Claude Dashboards goes from a question to a live, interactive, *auditable* dashboard, and what a viewer can actually do with it.

## Before recording

- Reload the dashboard and click **Reset filters** so it starts clean on Overview, last 12 months.
- Pick one theme and stay in it. Light is easier to read on video; switch to Dark only for the closing beat.
- Browser zoom 110% to 125% so the numbers read on a phone. Hide bookmarks and anything with your email or other tabs.
- Open each tab once first so the queries are warm and nothing shows a loading state on camera.
- Record at 1080p. Keep the cursor slow and pause a beat after each click so viewers can follow.

## Take

| Time | Action | Say / on screen |
|---|---|---|
| 0:00 | Overview, hold on the hero and KPI row | "This is a live executive dashboard over BigQuery, built with Claude Dashboards. Every number is a real query." |
| 0:08 | Change period from 12 to 6 months | "One filter, and every card re-queries." |
| 0:16 | Click **Outerwear & Coats** in the treemap | "Click a category and the whole dashboard drills into it: KPIs, trend, channels." |
| 0:26 | Click **Search** in the Channels list | "A second filter stacks on top. The chips show what's active." Click **Reset filters**. |
| 0:34 | **Customers** tab: hover a state on the map, click **California** | "A real map, not a grid. Hover for detail, click to filter everything." Click again to clear. |
| 0:46 | Point at the cohort heatmap | "Cohort retention, computed in SQL." |
| 0:52 | **Products** tab: sort by Growth, type "jeans" in search | "Sortable and searchable, with a trend column calculated from twelve months of data." |
| 1:00 | **Operations** tab: point at the funnel and the red step | "The funnel flags the biggest drop between stages." |
| 1:08 | **Audit and export:** go back to Overview, click the **Revenue** number | "And this is the part I care about: click any number..." |
| 1:12 | Sources panel opens, expand **Query** | "...and see the exact SQL behind it, where it ran, and when it refreshed." |
| 1:20 | Expand **Result**, click download CSV | "Download the rows as a CSV for Excel, so a business user can check my work." |
| 1:28 | Click **Dark** in the top-right switch, linger 2 seconds | "Presentation mode for demos." |
| 1:32 | Hold on the dashboard | "Built in an hour. Not a Tableau replacement, but a very fast way from question to auditable answer." |

## If something goes wrong on camera

- A card shows "Failed to load": click Refresh in the toolbar and re-take that clip.
- The map is slow to appear: open the Customers tab 10 seconds before the shot.
- Keep clips short and cut between tabs; nobody needs to see loading.

## Caption ideas

- "Every number is one click from its SQL, and one more click from a CSV."
- "Claude Dashboards over a live BigQuery warehouse: filters, drill-down, a real map and cohorts, built in conversation."
- Be upfront in the post that thelook is a public synthetic dataset.
