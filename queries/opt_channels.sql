-- Channel list
-- The traffic sources customers arrive from. Reads thelook_ecommerce.users.
SELECT DISTINCT traffic_source AS channel
FROM `bigquery-public-data.thelook_ecommerce.users`
ORDER BY channel
