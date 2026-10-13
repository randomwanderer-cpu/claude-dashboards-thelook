-- Department list
-- The departments that products belong to. Reads thelook_ecommerce.products.
SELECT DISTINCT department
FROM `bigquery-public-data.thelook_ecommerce.products`
ORDER BY department
