-- Category by month
-- Revenue per category per month for the last 12 complete months, used for the trend sparklines. Reads order_items, products and users.
-- Dashboard parameters: channel, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e) SELECT p.department, p.category, FORMAT_DATE('%Y-%m-01', DATE_TRUNC(DATE(oi.created_at), MONTH)) AS month, ROUND(SUM(oi.sale_price),0) AS revenue
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE oi.status NOT IN ('Cancelled','Returned') AND DATE(oi.created_at) >= DATE_SUB(e, INTERVAL 12 MONTH) AND DATE(oi.created_at) < e AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY p.department, p.category, month
ORDER BY p.department, p.category, month
