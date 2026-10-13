-- Distribution centers
-- Items, revenue, days to ship and return rate per distribution center for the selected period. Reads order_items, products, users and distribution_centers.
-- Dashboard parameters: category, channel, department, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT dc.name AS center, COUNT(*) AS items, ROUND(SUM(IF(oi.status NOT IN ('Cancelled','Returned'), oi.sale_price, 0)),0) AS revenue, ROUND(AVG(TIMESTAMP_DIFF(oi.shipped_at, oi.created_at, HOUR)) / 24, 2) AS days_to_ship, ROUND(SAFE_DIVIDE(COUNTIF(oi.status = 'Returned'), COUNTIF(oi.status IN ('Complete','Shipped','Returned'))), 3) AS return_rate
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
JOIN `bigquery-public-data.thelook_ecommerce.distribution_centers` dc ON dc.id = p.distribution_center_id
CROSS
JOIN b
WHERE DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH) AND DATE(oi.created_at) < e AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY center
ORDER BY revenue DESC
