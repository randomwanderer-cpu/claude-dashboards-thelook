-- Revenue by country
-- Top 10 markets by revenue for the selected period, with duplicate local-language country names merged. Reads order_items, products and users.
-- Dashboard parameters: category, channel, department, months (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT CASE WHEN u.country = 'Brasil' THEN 'Brazil' WHEN u.country = 'Deutschland' THEN 'Germany' WHEN u.country LIKE 'Espa%a' THEN 'Spain' ELSE u.country END AS market, ROUND(SUM(oi.sale_price),0) AS revenue, COUNT(DISTINCT oi.order_id) AS orders, COUNT(DISTINCT oi.user_id) AS customers
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE oi.status NOT IN ('Cancelled','Returned') AND DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH) AND DATE(oi.created_at) < e AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING))
GROUP BY market
ORDER BY revenue DESC
LIMIT 10
