-- Customer cohorts
-- Share of each first-order monthly cohort that ordered again in each following month, for the last 12 cohorts. Reads thelook_ecommerce.orders.
WITH o AS (SELECT user_id, DATE_TRUNC(DATE(created_at), MONTH) AS mo
FROM `bigquery-public-data.thelook_ecommerce.orders`
WHERE status NOT IN ('Cancelled','Returned')
GROUP BY user_id, mo),
f AS (SELECT user_id, MIN(mo) AS cohort
FROM o
GROUP BY user_id),
a AS (SELECT f.cohort, DATE_DIFF(o.mo, f.cohort, MONTH) AS k, COUNT(DISTINCT o.user_id) AS n
FROM o
JOIN f USING (user_id)
GROUP BY f.cohort, k),
s AS (SELECT cohort, n AS size
FROM a
WHERE k = 0),
b AS (SELECT DATE_TRUNC(CURRENT_DATE(), MONTH) AS e) SELECT FORMAT_DATE('%Y-%m', a.cohort) AS cohort, a.k AS months_since, a.n AS active, s.size, ROUND(SAFE_DIVIDE(a.n, s.size), 3) AS retention
FROM a
JOIN s USING (cohort)
CROSS
JOIN b
WHERE a.cohort >= DATE_SUB(e, INTERVAL 12 MONTH) AND a.cohort < e AND a.k BETWEEN 0 AND 6 AND DATE_ADD(a.cohort, INTERVAL a.k MONTH) < e
ORDER BY cohort, months_since
