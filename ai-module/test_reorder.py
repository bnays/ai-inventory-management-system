import math

import reorder


def _daily(*predicted_sales):
    return [{"date": f"2026-01-{i + 1:02d}", "predicted_sales": v} for i, v in enumerate(predicted_sales)]


def test_computes_reorder_point_from_a_known_forecast():
    # daily demand: 10, 12, 14, 12, 12 -> mean 12, population stdev = sqrt(8) = 2.8284271...
    daily_forecast = _daily(10, 12, 14, 12, 12)
    lead_time_days = 4
    service_level_z = 1.65

    result = reorder.calculate_reorder_point(daily_forecast, lead_time_days, service_level_z)

    expected_mean = 12.0
    # population stdev of [10,12,14,12,12]: variance = sum((x-12)^2)/5 = 8/5 = 1.6
    expected_stdev = math.sqrt(1.6)
    expected_safety_stock = round(service_level_z * expected_stdev * math.sqrt(lead_time_days))
    expected_reorder_point = round(expected_mean * lead_time_days) + expected_safety_stock

    assert result["average_daily_demand"] == expected_mean
    assert result["safety_stock"] == expected_safety_stock
    assert result["reorder_point"] == expected_reorder_point


def test_uses_the_default_service_level_z_when_not_provided():
    daily_forecast = _daily(10, 12, 14, 12, 12)
    lead_time_days = 4

    result = reorder.calculate_reorder_point(daily_forecast, lead_time_days)

    expected_mean = 12.0
    expected_stdev = math.sqrt(1.6)
    expected_safety_stock = round(1.65 * expected_stdev * math.sqrt(lead_time_days))
    expected_reorder_point = round(expected_mean * lead_time_days) + expected_safety_stock

    assert result["safety_stock"] == expected_safety_stock
    assert result["reorder_point"] == expected_reorder_point


def test_higher_lead_time_produces_a_higher_reorder_point_for_the_same_demand():
    daily_forecast = _daily(10, 12, 14, 12, 12)

    short_lead = reorder.calculate_reorder_point(daily_forecast, lead_time_days=2)
    long_lead = reorder.calculate_reorder_point(daily_forecast, lead_time_days=10)

    assert long_lead["reorder_point"] > short_lead["reorder_point"]


def test_zero_variance_demand_still_requires_stock_to_cover_the_lead_time():
    # constant demand -> stdev is 0, so safety_stock should be 0, but
    # reorder_point must still cover expected demand across the lead time.
    daily_forecast = _daily(5, 5, 5, 5, 5)

    result = reorder.calculate_reorder_point(daily_forecast, lead_time_days=6)

    assert result["safety_stock"] == 0
    assert result["reorder_point"] == 30  # 5/day * 6 days


def test_returns_an_error_dict_instead_of_raising_on_empty_forecast():
    result = reorder.calculate_reorder_point([], lead_time_days=5)

    assert "error" in result
    assert "reorder_point" not in result


def test_returns_an_error_dict_instead_of_raising_on_non_positive_lead_time():
    daily_forecast = _daily(10, 12, 14)

    result = reorder.calculate_reorder_point(daily_forecast, lead_time_days=0)

    assert "error" in result
    assert "reorder_point" not in result


def test_result_is_json_serializable():
    import json

    daily_forecast = _daily(10, 12, 14, 12, 12)
    result = reorder.calculate_reorder_point(daily_forecast, lead_time_days=4)

    # Should not raise -- every value in the result must be a plain JSON type.
    json.dumps(result)
