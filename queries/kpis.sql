-- Headline KPIs
-- Revenue, profit, orders, items, customers and average order value for the selected period and the period before. Reads order_items, products and users.
-- Dashboard parameters: category, channel, department, months, state (NULL means no filter; months defaults to 12)
WITH f AS (SELECT oi.order_id, oi.user_id, oi.sale_price, p.cost, DATE(oi.created_at) AS d
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
WHERE oi.status NOT IN ('Cancelled','Returned') AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))),
b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT IF(d >= DATE_SUB(e, INTERVAL m MONTH), 'current', 'prior') AS period, ROUND(SUM(sale_price),0) AS revenue, ROUND(SUM(sale_price - cost),0) AS profit, COUNT(DISTINCT order_id) AS orders, COUNT(*) AS items, COUNT(DISTINCT user_id) AS customers, ROUND(SAFE_DIVIDE(SUM(sale_price), COUNT(DISTINCT order_id)),2) AS aov
FROM f
CROSS
JOIN b
WHERE d >= DATE_SUB(e, INTERVAL m * 2 MONTH) AND d < e
GROUP BY period
