-- Customers by age and gender
-- Buying customers and revenue by age band and gender for the selected period. Reads order_items, products and users.
-- Dashboard parameters: category, channel, department, months, state (NULL means no filter; months defaults to 12)
WITH b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e, CAST(COALESCE({{months}}, 12) AS INT64) AS m) SELECT CASE WHEN u.age < 20 THEN '12-19' WHEN u.age < 30 THEN '20-29' WHEN u.age < 40 THEN '30-39' WHEN u.age < 50 THEN '40-49' WHEN u.age < 60 THEN '50-59' ELSE '60+' END AS age_band, IF(u.gender = 'F', 'Women', 'Men') AS gender, COUNT(DISTINCT oi.user_id) AS customers, ROUND(SUM(oi.sale_price),0) AS revenue
FROM `bigquery-public-data.thelook_ecommerce.order_items` oi
JOIN `bigquery-public-data.thelook_ecommerce.products` p ON p.id = oi.product_id
JOIN `bigquery-public-data.thelook_ecommerce.users` u ON u.id = oi.user_id
CROSS
JOIN b
WHERE oi.status NOT IN ('Cancelled','Returned') AND DATE(oi.created_at) >= DATE_SUB(e, INTERVAL m MONTH) AND DATE(oi.created_at) < e AND (CAST({{department}} AS STRING) IS NULL OR p.department = CAST({{department}} AS STRING)) AND (CAST({{category}} AS STRING) IS NULL OR p.category = CAST({{category}} AS STRING)) AND (CAST({{channel}} AS STRING) IS NULL OR u.traffic_source = CAST({{channel}} AS STRING)) AND (CAST({{state}} AS STRING) IS NULL OR u.state = CAST({{state}} AS STRING))
GROUP BY age_band, gender
ORDER BY age_band, gender
