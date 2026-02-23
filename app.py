"""
=============================================================================
STEP 3: WEB APPLICATION (Flask API + Frontend)
=============================================================================

This script creates a web server that:
1. Loads the trained model
2. Serves a beautiful web interface
3. Takes team selections from the user
4. Returns match predictions with probabilities

KEY WEB CONCEPTS:
- "API" = Application Programming Interface — a way for the frontend
          (what users see) to communicate with the backend (where the model lives)
- "Flask" = A lightweight Python web framework
- "Endpoint" = A URL that the server responds to (e.g., /predict)
- "JSON" = The data format used to send/receive data between frontend and backend
"""

from flask import Flask, request, jsonify, send_file
import joblib
import json
import numpy as np
import os

# ============================================================================
# LOAD MODEL AND ARTIFACTS
# ============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("Loading model artifacts...")
model = joblib.load(os.path.join(BASE_DIR, "model.joblib"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))
feature_cols = joblib.load(os.path.join(BASE_DIR, "feature_cols.joblib"))

with open(os.path.join(BASE_DIR, "team_stats.json"), "r") as f:
    team_stats = json.load(f)

with open(os.path.join(BASE_DIR, "model_metadata.json"), "r") as f:
    metadata = json.load(f)

TEAMS = sorted(team_stats.keys())
print(f" Model loaded: {metadata['model_type']} ({metadata['test_accuracy']:.1%} accuracy)")
print(f" {len(TEAMS)} teams available")


# ============================================================================
# CREATE FLASK APP
# ============================================================================

app = Flask(__name__)


@app.route("/")
def home():
    """Serve the main web page."""
    return send_file(os.path.join(BASE_DIR, "index.html"))


@app.route("/api/teams")
def get_teams():
    """Return list of available teams."""
    return jsonify({"teams": TEAMS})


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Make a prediction for a match.
    
    Expects JSON: {"home_team": "Arsenal", "away_team": "Chelsea"}
    Returns JSON with probabilities for each outcome.
    """
    data = request.get_json()
    home_team = data.get("home_team")
    away_team = data.get("away_team")

    # Validate inputs
    if not home_team or not away_team:
        return jsonify({"error": "Please select both teams"}), 400
    if home_team == away_team:
        return jsonify({"error": "Home and away teams must be different"}), 400
    if home_team not in team_stats or away_team not in team_stats:
        return jsonify({"error": "Unknown team selected"}), 400

    # Build feature vector (same features we used in training!)
    hs = team_stats[home_team]
    as_ = team_stats[away_team]

    features = {
        "home_win_rate": hs["win_rate"],
        "home_draw_rate": hs["draw_rate"],
        "home_avg_goals_scored": hs["avg_goals_scored"],
        "home_avg_goals_conceded": hs["avg_goals_conceded"],
        "home_goal_diff": hs["goal_difference"],
        "home_ppg": hs["points_per_game"],
        "home_home_win_rate": hs["home_win_rate"],
        "home_shots_avg": hs["shots_avg"],
        "home_sot_avg": hs["shots_on_target_avg"],
        "away_win_rate": as_["win_rate"],
        "away_draw_rate": as_["draw_rate"],
        "away_avg_goals_scored": as_["avg_goals_scored"],
        "away_avg_goals_conceded": as_["avg_goals_conceded"],
        "away_goal_diff": as_["goal_difference"],
        "away_ppg": as_["points_per_game"],
        "away_away_win_rate": as_["away_win_rate"],
        "away_shots_avg": as_["shots_avg"],
        "away_sot_avg": as_["shots_on_target_avg"],
        "win_rate_diff": hs["win_rate"] - as_["win_rate"],
        "ppg_diff": hs["points_per_game"] - as_["points_per_game"],
        "goal_diff_diff": hs["goal_difference"] - as_["goal_difference"],
        "attack_vs_defense": hs["avg_goals_scored"] - as_["avg_goals_conceded"],
        "defense_vs_attack": as_["avg_goals_scored"] - hs["avg_goals_conceded"],
    }

    # Create feature array in the correct order
    X = np.array([[features[col] for col in feature_cols]])

    # Scale features (same transformation as training)
    X_scaled = scaler.transform(X)

    # Get prediction and probabilities
    prediction = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]

    outcomes = ["Home Win", "Draw", "Away Win"]

    return jsonify({
        "prediction": outcomes[prediction],
        "probabilities": {
            "home_win": round(float(probabilities[0]) * 100, 1),
            "draw": round(float(probabilities[1]) * 100, 1),
            "away_win": round(float(probabilities[2]) * 100, 1),
        },
        "home_team": home_team,
        "away_team": away_team,
        "model_info": {
            "type": metadata["model_type"],
            "accuracy": round(metadata["test_accuracy"] * 100, 1),
        },
        "team_comparison": {
            "home_ppg": round(hs["points_per_game"], 2),
            "away_ppg": round(as_["points_per_game"], 2),
            "home_goals_avg": round(hs["avg_goals_scored"], 2),
            "away_goals_avg": round(as_["avg_goals_scored"], 2),
            "home_win_rate": round(hs["win_rate"] * 100, 1),
            "away_win_rate": round(as_["win_rate"] * 100, 1),
        }
    })


@app.route("/api/model-info")
def model_info():
    """Return information about the trained model."""
    return jsonify(metadata)


if __name__ == "__main__":
    print("\n Starting EPL Predictor Web App...")
    print("   Open http://localhost:5000 in your browser\n")
    app.run(debug=True, port=5000)
