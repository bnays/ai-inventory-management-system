import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Unified list: 14 Original + 10 New Additions
products = [
    {"sku": "LAP-001", "avg_daily": 2}, {"sku": "MON-002", "avg_daily": 3},
    {"sku": "MSE-003", "avg_daily": 5}, {"sku": "KBD-004", "avg_daily": 4},
    {"sku": "CHR-005", "avg_daily": 1}, {"sku": "DSK-006", "avg_daily": 1},
    {"sku": "SWI-007", "avg_daily": 0.5}, {"sku": "WAP-008", "avg_daily": 2},
    {"sku": "HUB-009", "avg_daily": 8}, {"sku": "SHR-010", "avg_daily": 1},
    {"sku": "TAB-011", "avg_daily": 3}, {"sku": "MIC-012", "avg_daily": 2},
    {"sku": "IPH-767", "avg_daily": 4}, {"sku": "MC-487", "avg_daily": 10},
    {"sku": "AUD-015", "avg_daily": 3}, {"sku": "MON-016", "avg_daily": 2},
    {"sku": "MSE-017", "avg_daily": 6}, {"sku": "KBD-018", "avg_daily": 4},
    {"sku": "CHR-019", "avg_daily": 0.5}, {"sku": "DSK-020", "avg_daily": 1},
    {"sku": "WAP-021", "avg_daily": 2}, {"sku": "HUB-022", "avg_daily": 7},
    {"sku": "DRV-023", "avg_daily": 5}, {"sku": "STR-024", "avg_daily": 3}
]

# Timeframe: Last 3 Years (Ending Today)
end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
start_date = end_date - timedelta(days=3*365)
date_range = pd.date_range(start=start_date, end=end_date)

history_data = []

for product in products:
    for date in date_range:
        # Generate Poisson distribution for realistic variability
        quantity = np.random.poisson(product['avg_daily'])
        if quantity > 0:
            history_data.append({
                "product_sku": product['sku'],
                "quantity_sold": quantity,
                "date": date.strftime('%Y-%m-%d')
            })

df = pd.DataFrame(history_data)
df.to_csv('sku_sales_history_dataset.csv', index=False)
print(f"Success: Generated {len(df)} records across 24 products for AI synchronization.")