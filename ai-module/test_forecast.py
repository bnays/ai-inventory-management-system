from datetime import datetime
from unittest.mock import MagicMock, patch

import pandas as pd

import forecast


def _make_sales_history(days=30, sku="TEST-SKU"):
    dates = pd.date_range(end=datetime.now(), periods=days, freq="D")
    quantities = [10 + (i % 5) for i in range(days)]
    return pd.DataFrame({"date": dates, "quantity_sold": quantities})


def _mock_connect(mock_connect_fn):
    mock_conn = MagicMock()
    mock_conn.is_connected.return_value = True
    mock_connect_fn.return_value = mock_conn
    return mock_conn


@patch("forecast.pd.read_sql")
@patch("forecast.mysql.connector.connect")
def test_returns_error_when_no_historical_data(mock_connect, mock_read_sql):
    _mock_connect(mock_connect)
    mock_read_sql.return_value = pd.DataFrame(columns=["date", "quantity_sold"])

    result = forecast.run_forecast("NO-SUCH-SKU")

    assert result == {"error": "No historical data found for SKU: NO-SUCH-SKU"}


@patch("forecast.pd.read_sql")
@patch("forecast.mysql.connector.connect")
def test_returns_forecast_shape_with_sufficient_history(mock_connect, mock_read_sql):
    _mock_connect(mock_connect)
    mock_read_sql.return_value = _make_sales_history()

    result = forecast.run_forecast("TEST-SKU")

    assert result["sku"] == "TEST-SKU"
    assert isinstance(result["accuracy"], (int, float))
    assert result["today"] == datetime.now().strftime("%Y-%m-%d")

    assert len(result["daily"]) == 7
    for row in result["daily"]:
        assert "date" in row and "predicted_sales" in row
        assert isinstance(row["predicted_sales"], int)

    assert len(result["weekly"]) <= 4
    assert len(result["monthly"]) <= 12
    assert len(result["yearly"]) >= 1
    assert result["yearly"][0]["label"] == str(datetime.now().year)


@patch("forecast.pd.read_sql")
@patch("forecast.mysql.connector.connect")
def test_strips_whitespace_from_sku_before_querying(mock_connect, mock_read_sql):
    _mock_connect(mock_connect)
    mock_read_sql.return_value = _make_sales_history()

    forecast.run_forecast("  TEST-SKU  ")

    call_kwargs = mock_read_sql.call_args.kwargs
    assert call_kwargs["params"] == ["TEST-SKU"]


@patch("forecast.mysql.connector.connect")
def test_returns_error_instead_of_raising_on_db_failure(mock_connect):
    mock_connect.side_effect = Exception("Could not connect to DB")

    result = forecast.run_forecast("TEST-SKU")

    assert "error" in result
    assert "Could not connect to DB" in result["error"]
