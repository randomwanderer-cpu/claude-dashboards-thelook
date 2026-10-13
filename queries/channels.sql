-- Channel performance
-- Revenue, growth, share, orders, customers and average order value by acquisition channel. Ignores the channel filter so every channel stays visible. Reads order_items, products and users.
-- Dashboard parameters: category, department, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m),
c AS (SELECT u.traffic_source AS channel, ROUND(SUM(IF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH), oi.sale_price, 0)),0) AS revenue, ROUND(SUM(IF(NOT (DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH)), oi.sale_price, 0)),0) AS prior_revenue, COUNT(DISTINCT IF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH), oi.order_id, NULL)) AS orders, COUNT(DISTINCT IF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH), oi.user_id, NULL)) AS customers
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE oi.status NOT IN ('Cancelled','Returned') AND DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m * 2 MONTH) AND DATE(oi.created_at) < e AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY channel) SELECT channel, revenue, prior_revenue, orders, customers, ROUND(SAFE_DIVIDE(revenue, orders),2) AS aov, ROUND(SAFE_DIVIDE(revenue, prior_revenue) - 1, 3) AS growth, ROUND(SAFE_DIVIDE(revenue, SUM(revenue) OVER ()), 3) AS share
FROM c
WHERE revenue > 0
ORDER BY revenue DESC
