-- Category performance
-- Revenue, prior-period revenue, growth, profit and margin per department and category for the selected period. Ignores the department and category filters so the full mix stays visible. Reads order_items, products and users.
-- Dashboard parameters: channel, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m),
c AS (SELECT p.department, p.category, ROUND(SUM(IF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH), oi.sale_price, 0)),0) AS revenue, ROUND(SUM(IF(NOT (DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH)), oi.sale_price, 0)),0) AS prior_revenue, ROUND(SUM(IF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH), oi.sale_price - p.cost, 0)),0) AS profit, COUNTIF(DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH)) AS items
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE oi.status NOT IN ('Cancelled','Returned') AND DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m * 2 MONTH) AND DATE(oi.created_at) < e AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY p.department, p.category) SELECT department, category, revenue, prior_revenue, profit, items, ROUND(SAFE_DIVIDE(revenue, prior_revenue) - 1, 3) AS growth, ROUND(SAFE_DIVIDE(profit, revenue), 3) AS margin
FROM c
WHERE revenue > 0
ORDER BY revenue DESC
