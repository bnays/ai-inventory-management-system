import pandas as pd
import numpy as np
import json
import sys
import os
import mysql.connector
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from dotenv import load_dotenv

# Load database credentials from .env file
load_dotenv()

def run_forecast(sku_input):
    db = None
    try:
        # 1. Database Connection
        db = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASS', ''), 
            database=os.getenv('DB_NAME', 'ai_inventory_system')
        )

        # 2. Fetch Historical Data
        query = """
            SELECT sale_date as date, quantity_sold 
            FROM sales_history 
            WHERE product_sku = %s 
            ORDER BY sale_date ASC
        """
        data = pd.read_sql(query, db, params=[sku_input.strip()])

        if data.empty:
            return {"error": f"No historical data found for SKU: {sku_input}"}

        # 3. Data Preparation
        data['date'] = pd.to_datetime(data['date'])
        
        # 4. Feature Engineering: Lags and Rolling Averages
        data['lag1'] = data['quantity_sold'].shift(1).fillna(0)
        data['lag2'] = data['quantity_sold'].shift(2).fillna(0)
        data['roll3'] = data[['quantity_sold', 'lag1', 'lag2']].mean(axis=1)
        
        X = data[['lag1', 'lag2', 'roll3']]
        y = data['quantity_sold']

        # 5. Train Random Forest Model (Fixed Seed for consistency)
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        accuracy = r2_score(y, model.predict(X))

        # 6. Deterministic Forecast Simulation (Next 365 Days)
        # We use recursive forecasting: Today's prediction becomes tomorrow's lag
        today = datetime.now()
        future_dates = pd.date_range(start=today, periods=365)
        
        forecast_results = []
        # Start with the very last known record from your database
        current_features = X.iloc[-1].values.reshape(1, -1) 

        for _ in range(365):
            # Predict using the trained AI model
            prediction = model.predict(current_features)[0]
            forecast_results.append(prediction)
            
            # Update Features for the next day:
            # new_lag1 = current prediction
            # new_lag2 = previous lag1
            # new_roll3 = average of the new window
            new_lag1 = prediction
            new_lag2 = current_features[0][0]
            new_roll = (new_lag1 + new_lag2 + current_features[0][1]) / 3
            current_features = np.array([[new_lag1, new_lag2, new_roll]])

        forecast_df = pd.DataFrame({
            "date": future_dates,
            "predicted_sales": np.array(forecast_results).round().astype(int)
        }).set_index("date")

        # 7. Aggregate Projections for Dashboard
        daily = forecast_df.head(7).reset_index()
        daily['date'] = daily['date'].dt.strftime('%Y-%m-%d')

        weekly = forecast_df.resample('W').sum().head(4).reset_index()
        weekly['label'] = weekly['date'].dt.strftime('Week %U')

        monthly = forecast_df.resample('M').sum().head(12).reset_index()
        monthly['label'] = monthly['date'].dt.strftime('%b %Y')

        yearly = forecast_df.resample('Y').sum().reset_index()
        yearly['label'] = str(today.year)

        return {
            "sku": sku_input,
            "accuracy": round(accuracy * 100, 2),
            "today": today.strftime('%Y-%m-%d'),
            "daily": daily[['date', 'predicted_sales']].to_dict(orient='records'),
            "weekly": weekly[['label', 'predicted_sales']].to_dict(orient='records'),
            "monthly": monthly[['label', 'predicted_sales']].to_dict(orient='records'),
            "yearly": yearly[['label', 'predicted_sales']].to_dict(orient='records')
        }

    except Exception as e:
        return {"error": str(e)}
    finally:
        if db and db.is_connected():
            db.close()

if __name__ == "__main__":
    sku_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    result = run_forecast(sku_arg)
    print(json.dumps(result))