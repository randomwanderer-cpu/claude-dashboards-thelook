-- Monthly trend
-- Revenue, profit, orders and customers per complete month for 24 months, with a 3-month average and prior-year comparison. Reads order_items, products and users.
-- Dashboard parameters: category, channel, department, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e),
cal AS (SELECT mo
FROM b, UNNEST(GENERATE_DATE_ARRAY(DATE_SUB(e, INTERVAL 36 MONTH), DATE_SUB(e, INTERVAL 1 MONTH), INTERVAL 1 MONTH)) AS mo),
f AS (SELECT DATE_TRUNC(DATE(oi.created_at), MONTH) AS mo, SUM(oi.sale_price) AS revenue, SUM(oi.sale_price - p.cost) AS profit, COUNT(DISTINCT oi.order_id) AS orders, COUNT(DISTINCT oi.user_id) AS customers
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
WHERE oi.status NOT IN ('Cancelled','Returned') AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY mo),
j AS (SELECT cal.mo, COALESCE(f.revenue,0) AS revenue, COALESCE(f.profit,0) AS profit, COALESCE(f.orders,0) AS orders, COALESCE(f.customers,0) AS customers
FROM cal
LEFT
JOIN f USING (mo)),
w AS (SELECT mo, revenue, profit, orders, customers, AVG(revenue) OVER (ORDER BY mo ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS ma3, LAG(revenue, 12) OVER (ORDER BY mo) AS prior_year
FROM j) SELECT FORMAT_DATE('%Y-%m-01', mo) AS month, ROUND(revenue,0) AS revenue, ROUND(profit,0) AS profit, orders, customers, ROUND(SAFE_DIVIDE(revenue, orders),2) AS aov, ROUND(ma3,0) AS ma3, ROUND(prior_year,0) AS prior_year, ROUND(SAFE_DIVIDE(revenue, prior_year) - 1, 3) AS yoy
FROM w
CROSS
JOIN b
WHERE mo >= DATE_SUB(e, INTERVAL 24 MONTH)
ORDER BY month
