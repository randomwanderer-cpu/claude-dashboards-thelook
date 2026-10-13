-- Session funnel
-- Distinct web sessions that viewed a product, added to cart, purchased or cancelled in the selected period. Reads thelook_ecommerce.events.
-- Dashboard parameters: channel, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT event_type AS stage, COUNT(DISTINCT session_id) AS sessions
FROM `bigquery-public-data.thelook_ecommerce.events`
CROSS
JOIN b
WHERE event_type IN ('product','cart','purchase','cancel') AND DATE(created_at) >= DATE_SUB(e, INTERVAL m MONTH) AND DATE(created_at) < e AND (CAST({{channel}} AS STRING) IS NULL OR traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR state = CAST({{state}} AS STRING))
GROUP BY stage
