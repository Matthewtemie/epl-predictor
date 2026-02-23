# ⚽ MatchForecast — Premier League Predictor

An ML-powered web app that predicts Premier League match outcomes, trained on **1,781 real matches** across 5 seasons of football-data.co.uk data.

**[→ Try the live demo](https://matthewtemie.github.io/epl-predictor/)**

---

## How It Works

Pick a home team and an away team — the model returns win/draw/loss probabilities based on historical performance patterns.

Under the hood: a **Logistic Regression** classifier trained on 23 engineered features (points per game, goal difference, home/away win rates, attack vs defence metrics, and more) extracted from every Premier League match since 2021-22.

**Model accuracy: 58%** on held-out test data — competitive with professional forecasting systems (bookmaker models typically hit 50-55%).

## Tech Stack

- **ML**: scikit-learn, pandas, NumPy
- **Backend**: Flask + Flask-CORS
- **Frontend**: Vanilla HTML/CSS/JS
- **Data**: football-data.co.uk (5 seasons, 1,781 matches)
- **Design**: Instrument Sans, IBM Plex Mono, sports editorial aesthetic

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/epl-predictor.git
cd epl-predictor

pip install -r requirements.txt

# Run the full pipeline (optional — pre-trained model included)
python 01_prepare_data.py
python 02_train_model.py

# Start the web app
python app.py
# Open http://localhost:5000
```

The pre-trained model is included, so you can skip straight to `python app.py` if you just want to run it.

## Project Structure

```
epl-predictor/
├── data/                    # Real season CSVs from football-data.co.uk
├── docs/                    # GitHub Pages (static demo)
│   └── index.html           # Self-contained client-side version
├── 01_prepare_data.py       # Data pipeline & feature engineering
├── 02_train_model.py        # Model training & evaluation
├── app.py                   # Flask API server
├── index.html               # Full web frontend (needs Flask)
├── requirements.txt         # Python dependencies
├── model.joblib             # Pre-trained model
├── team_stats.json          # Computed team statistics
├── GUIDE.md                 # Detailed ML walkthrough
└── README.md
```

## Model Performance

| Model               | CV Accuracy | Test Accuracy |
|----------------------|:-----------:|:-------------:|
| **Logistic Regression** | 54.3%   | **58.0%**     |
| Random Forest        | 51.9%      | 49.9%         |
| Gradient Boosting    | 47.5%      | 44.0%         |

The model predicts home wins with 81% recall, away wins with 60%, and draws with 12%. Draws are notoriously difficult to predict in football — even state-of-the-art models struggle here.

## Updating the Data

1. Download the latest season CSV from [football-data.co.uk](https://www.football-data.co.uk/englandm.php)
2. Drop it into the `data/` folder
3. Run `python 01_prepare_data.py` then `python 02_train_model.py`
4. Restart the app

## Teams (2025-26)

Arsenal · Aston Villa · Bournemouth · Brentford · Brighton · Burnley · Chelsea · Crystal Palace · Everton · Fulham · Leeds United · Liverpool · Man City · Man United · Newcastle · Nottm Forest · Sunderland · Tottenham · West Ham · Wolves

## License

MIT

---

*Data sourced from [football-data.co.uk](https://www.football-data.co.uk/). Football is beautifully unpredictable — no model will ever be perfect, and that's what makes the game exciting.*
