-- Fulfilment by month
-- Average days to ship and to deliver, return rate and cancel rate per month. Reads order_items, products and users.
-- Dashboard parameters: category, channel, department, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT FORMAT_DATE('%Y-%m-01', DATE_TRUNC(DATE(oi.created_at), MONTH)) AS month, ROUND(AVG(TIMESTAMP_DIFF(oi.shipped_at, oi.created_at, HOUR)) / 24, 2) AS days_to_ship, ROUND(AVG(TIMESTAMP_DIFF(oi.delivered_at, oi.shipped_at, HOUR)) / 24, 2) AS days_to_deliver, ROUND(SAFE_DIVIDE(COUNTIF(oi.status = 'Returned'), COUNTIF(oi.status IN ('Complete','Shipped','Returned'))), 3) AS return_rate, ROUND(SAFE_DIVIDE(COUNTIF(oi.status = 'Cancelled'), COUNT(*)), 3) AS cancel_rate, COUNT(*) AS items
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE DATE(oi.created_at) >= DATE_SUB(e, INTERVAL GREATEST(m, 6) MONTH) AND DATE(oi.created_at) < e AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY month
ORDER BY month
