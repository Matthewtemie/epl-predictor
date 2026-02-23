# MatchForecast — Complete ML Guide

## From Zero to Deployed Web App

This guide walks you through building a machine learning model that predicts Premier League match outcomes using real historical data, then deploying it as a web application. Every concept is explained for beginners.

---

## Table of Contents

1. [The Big Picture — What Is Machine Learning?](#1-the-big-picture)
2. [Project Architecture](#2-project-architecture)
3. [Step 1: Real Data Collection & Preparation](#3-step-1-data)
4. [Step 2: Feature Engineering](#4-step-2-features)
5. [Step 3: Model Training](#5-step-3-training)
6. [Step 4: Evaluation — Is Our Model Good?](#6-step-4-evaluation)
7. [Step 5: Building the Web App](#7-step-5-web-app)
8. [Step 6: Deployment](#8-step-6-deployment)
9. [How to Improve the Model](#9-improvements)
10. [Glossary of ML Terms](#10-glossary)

---

## 1. The Big Picture — What Is Machine Learning? <a name="1-the-big-picture"></a>

Machine learning is teaching a computer to find patterns in data and use those patterns to make predictions on new, unseen data.

Think of it like this: if you've watched hundreds of Premier League matches, you develop an intuition — "Liverpool at home against a promoted side is almost certain to win." ML does the same thing, but mathematically and at scale.

**Our ML pipeline has 5 stages:**

```
Raw Data → Feature Engineering → Model Training → Evaluation → Deployment
   📊            🔧                  🧠              ✅            🌐
```

**Our specific task** is called **classification** — we're putting each match into one of three categories (classes): Home Win, Draw, or Away Win.

---

## 2. Project Architecture <a name="2-project-architecture"></a>

```
epl-predictor/
├── data/                       # Real CSV data from football-data.co.uk
│   ├── E0_2021-22.csv          # Season 2021-22 (380 matches)
│   ├── E0_2022-23.csv          # Season 2022-23 (380 matches)
│   ├── E0_2023-24.csv          # Season 2023-24 (380 matches)
│   ├── E0_2024-25.csv          # Season 2024-25 (380 matches)
│   └── E0_2025-26.csv          # Season 2025-26 (261 matches, in progress)
├── 01_prepare_data.py          # Data loading, cleaning & feature engineering
├── 02_train_model.py           # Model training & evaluation
├── app.py                      # Flask web server (API)
├── index.html                  # Web frontend
├── requirements.txt            # Python dependencies
├── model.joblib                # Saved trained model
├── scaler.joblib               # Saved feature scaler
├── feature_cols.joblib         # Saved feature column names
├── team_stats.json             # Pre-computed team statistics (20 teams)
├── model_metadata.json         # Model performance metadata
├── training_data.csv           # Processed training dataset
└── raw_matches.csv             # Combined raw match results
```

---

## 3. Step 1: Real Data Collection & Preparation <a name="3-step-1-data"></a>

### Data Source

Our data comes from **football-data.co.uk**, one of the most established free football statistics resources. They publish CSV files for every Premier League season going back to 1993, updated after every matchday.

Download page: https://www.football-data.co.uk/englandm.php

### What's in the Data

Each row is one match. The key columns we use:

| Column | Meaning | Example |
|--------|---------|---------|
| `HomeTeam` | Team playing at home | Arsenal |
| `AwayTeam` | Team playing away | Chelsea |
| `FTHG` | Full Time Home Goals | 2 |
| `FTAG` | Full Time Away Goals | 1 |
| `FTR` | Full Time Result | H (Home Win), D (Draw), A (Away Win) |
| `HS` / `AS` | Home/Away Shots | 15 / 10 |
| `HST` / `AST` | Shots on Target | 7 / 4 |

The CSVs also include half-time scores, corners, fouls, cards, referee names, and betting odds from multiple bookmakers — all of which could be used as additional features.

### Our Dataset

We use **5 seasons of real Premier League data**:

| Season | Matches | Notes |
|--------|---------|-------|
| 2021-22 | 380 | Full season |
| 2022-23 | 380 | Full season |
| 2023-24 | 380 | Full season |
| 2024-25 | 380 | Full season |
| 2025-26 | 261 | Current season (through Feb 2026) |
| **Total** | **1,781** | |

**Outcome distribution** from this data:

- Home Wins: 44.3% — home advantage is real and significant
- Draws: 23.6% — the hardest outcome to predict
- Away Wins: 32.1%

### The Three-Tier Data Pipeline

The `01_prepare_data.py` script has a smart loading strategy:

1. **Local files first** — checks the `data/` folder for any CSVs with the right columns
2. **Auto-download** — tries to fetch season files from football-data.co.uk
3. **Embedded fallback** — uses ~180 real match results hardcoded in the script

This means the project works out of the box, but gets much better when you provide full season CSVs.

### How to Update the Data

1. Download the latest CSV from https://www.football-data.co.uk/englandm.php
2. Drop it in the `data/` folder (any filename works, as long as it's a `.csv` with the right columns)
3. Re-run `python 01_prepare_data.py` then `python 02_train_model.py`
4. Restart the web app

The script automatically detects and loads every CSV it finds.

### Key Concept — Train/Test Split

We split data 80/20. The model trains on 80% (1,424 matches) and we test it on the hidden 20% (357 matches) to see if it genuinely learned patterns vs. just memorizing the training data.

---

## 4. Step 2: Feature Engineering <a name="4-step-2-features"></a>

**This is the most important step.** Raw match results aren't enough — we create "features" (inputs) that help the model understand context.

Think about what a football pundit considers before predicting a match: recent form, goal-scoring ability, defensive strength, home advantage. We encode this mathematically.

### Our 23 Features Per Match

| Feature Group | Features | Why It Matters |
|---|---|---|
| **Win Rate** | `home_win_rate`, `away_win_rate` | Overall team quality |
| **Goals** | `avg_goals_scored`, `avg_goals_conceded` | Attacking/defensive strength |
| **Points** | `points_per_game` | League performance |
| **Home/Away Specific** | `home_home_win_rate`, `away_away_win_rate` | Some teams are far stronger at home |
| **Shots** | `shots_avg`, `shots_on_target_avg` | How many chances they create |
| **Derived Differences** | `ppg_diff`, `goal_diff_diff`, `attack_vs_defense` | Relative strength between the two teams |

### Example: Arsenal (home) vs Wolves (away)

Using real stats from our dataset:

```
Arsenal PPG:       2.09    Wolves PPG:        1.06
PPG Difference:   +1.03    → Strong home advantage

Arsenal Goals/Game: 2.02   Wolves Goals/Game:  1.07
Arsenal Conceded:   0.97   Wolves Conceded:    1.59

Arsenal Home Win%:  70.8%  Wolves Away Win%:  23.6%
```

The model sees these numbers and learns: "When the PPG difference is large and positive, and the home team has a high home win rate, the home team almost always wins."

### Real Team Rankings (from our data)

| Rank | Team | PPG | Win Rate |
|------|------|-----|----------|
| 1 | Man City | 2.23 | 69% |
| 2 | Arsenal | 2.09 | 63% |
| 3 | Liverpool | 2.06 | 61% |
| 4 | Chelsea | 1.65 | 46% |
| 5 | Aston Villa | 1.63 | 48% |
| 6 | Newcastle | 1.58 | 45% |
| 7 | Man United | 1.57 | 45% |
| 8 | Tottenham | 1.48 | 44% |
| ... | ... | ... | ... |
| 19 | Burnley | 0.75 | 16% |
| 20 | Leeds United | 0.97 | 23% |

These rankings are computed across all seasons a team appears in the dataset. Promoted teams like Sunderland have fewer data points, which is a known limitation.

---

## 5. Step 3: Model Training <a name="5-step-3-training"></a>

We tried three algorithms:

### Logistic Regression (Winner ✅)

The simplest approach. Finds a mathematical boundary between classes. Think of drawing lines on a graph to separate Home Wins, Draws, and Away Wins. Fast, interpretable, and works well with clean features. Often the best choice when you have fewer features relative to your dataset size.

### Random Forest

Creates 200 "decision trees" — each one asks a series of yes/no questions (like "Is home PPG > 1.5?"), and then all trees vote on the outcome. Powerful but can overfit, especially when many features are correlated (as ours are).

### Gradient Boosting

Builds trees one at a time, where each new tree focuses on fixing mistakes from previous trees. Often the most accurate for structured data, but needs careful hyperparameter tuning to avoid overfitting.

### Results (on 1,781 real matches)

| Model | Cross-Validation | Test Accuracy |
|-------|:---:|:---:|
| **Logistic Regression** | 54.3% | **58.0%** ✅ |
| Random Forest | 51.9% | 49.9% |
| Gradient Boosting | 47.5% | 44.0% |

Logistic Regression wins by a clear margin. This is common in sports prediction — simpler models generalize better because football has a lot of inherent randomness that complex models can mistake for patterns.

---

## 6. Step 4: Evaluation — Is 58% Actually Good? <a name="6-step-4-evaluation"></a>

**Yes — it's a genuinely useful model.** Here's the context:

| Approach | Accuracy |
|----------|----------|
| Random guessing (3 outcomes) | 33.3% |
| Always predicting "Home Win" | ~44% |
| **Our model** | **58.0%** |
| Professional betting models | 50-55% |
| State-of-the-art research models | 55-60% |

Our model beats the "always pick home" baseline by 14 percentage points and sits right in the range of professional forecasting systems. With a simple Logistic Regression and only 23 features — that's a strong result.

### The Confusion Matrix

```
                    Predicted:
                        Home     Draw     Away
  Actual Home Win:       128        9       21
  Actual     Draw:        50       10       24
  Actual Away Win:        38        8       69
```

What this tells us:

- **Home Wins**: 81% recall — the model is very confident and mostly correct when predicting home wins
- **Away Wins**: 60% recall — solid performance, especially for strong away teams
- **Draws**: 12% recall — draws remain the hardest outcome to predict (this is true for every football model ever built)

### Why Draws Are So Hard

A draw requires both teams to score exactly the same number of goals. There's no "draw-type team" — draws happen somewhat randomly across all team matchups. Even bookmakers struggle with draws, which is why draw odds are typically the highest.

---

## 7. Step 5: Building the Web App <a name="7-step-5-web-app"></a>

### Backend (Flask API — `app.py`)

The Flask server loads the trained model on startup and exposes two endpoints:

- `GET /api/teams` — returns the list of 20 Premier League teams
- `POST /api/predict` — accepts two teams, returns prediction with probabilities

**The prediction flow:**

1. Receive home and away team names
2. Look up their stats from `team_stats.json`
3. Build a feature vector (same 23 features used in training)
4. Scale the features using the saved scaler
5. Call `model.predict_proba()` for probability of each outcome
6. Return results as JSON with probabilities, team comparison stats, and model metadata

### Frontend (`index.html`)

The web interface uses an editorial sports design inspired by publications like The Athletic and FiveThirtyEight:

- **Font**: Instrument Sans for all text, IBM Plex Mono for data/numbers
- **Layout**: Cream background, white cards, pitch green accent colour
- **Interaction**: Select two teams, click predict, see animated probability bars and head-to-head stats
- **Responsive**: Works on mobile and desktop

### The 20 Teams (2025-26 Season)

Arsenal, Aston Villa, Bournemouth, Brentford, Brighton, Burnley, Chelsea, Crystal Palace, Everton, Fulham, Leeds United, Liverpool, Man City, Man United, Newcastle, Nottm Forest, Sunderland, Tottenham, West Ham, Wolves.

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Prepare data and train model (one-time setup)
python 01_prepare_data.py
python 02_train_model.py

# Start the web app
python app.py

# Open http://localhost:5000 in your browser
```

---

## 8. Step 6: Deployment <a name="8-step-6-deployment"></a>

### Option A: Railway (Easiest, free tier)

```bash
# Push to GitHub
git init && git add . && git commit -m "MatchForecast"
gh repo create match-forecast --public --push

# Go to railway.app → New Project → Deploy from GitHub
# Set start command: gunicorn app:app --bind 0.0.0.0:$PORT
```

### Option B: Render (Free tier)

1. Push to GitHub
2. Go to render.com → New Web Service
3. Connect your repo
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`

### Option C: Heroku

```bash
echo "web: gunicorn app:app" > Procfile
heroku create match-forecast
git push heroku main
```

### Option D: Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

---

## 9. How to Improve the Model <a name="9-improvements"></a>

### Quick Wins

1. **Rolling averages** — use "last 5 games" form instead of full-season averages; a team's recent form is more predictive than their stats from 8 months ago
2. **Add more features**: corners, fouls, cards, referee tendencies (all available in the football-data.co.uk CSVs you already have)
3. **Head-to-head history** — some teams consistently beat certain opponents regardless of form
4. **Include betting odds as features** — bookmaker odds encode expert knowledge and massive amounts of research; the `B365H`, `B365D`, `B365A` columns in the CSVs are Bet365's pre-match odds

### Intermediate

5. **Elo ratings** — dynamic team strength ratings that update after every match (like chess ratings)
6. **Feature selection** — remove noisy features that hurt more than help using techniques like Recursive Feature Elimination
7. **Hyperparameter tuning** — use `GridSearchCV` to find optimal model settings
8. **Class weighting** — use `class_weight='balanced'` in Logistic Regression to help the model with the difficult "Draw" class

### Advanced

9. **XGBoost or LightGBM** — more powerful gradient boosting libraries with better regularization
10. **Neural networks** — deep learning for complex non-linear patterns
11. **Ensemble methods** — combine multiple models (e.g., average Logistic Regression + XGBoost predictions)
12. **Time-aware splits** — instead of random 80/20, train on past seasons and test on the current season to better simulate real-world prediction

---

## 10. Glossary of ML Terms <a name="10-glossary"></a>

| Term | Meaning |
|------|---------|
| **Feature** | An input variable the model uses (e.g., win rate, goals scored) |
| **Target** | What you're trying to predict (match outcome: H, D, or A) |
| **Training set** | Data the model learns from (80% = 1,424 matches) |
| **Test set** | Data hidden from the model to evaluate performance (20% = 357 matches) |
| **Classification** | Predicting a category (Home Win / Draw / Away Win) |
| **Accuracy** | Percentage of correct predictions on the test set |
| **Overfitting** | Model memorizes training data but fails on new data |
| **Cross-validation** | Training/testing multiple times on different data splits for a more reliable accuracy estimate |
| **Feature scaling** | Normalizing features to the same range (mean=0, std=1) so no single feature dominates |
| **Precision** | Of predictions labeled X, how many were actually X? |
| **Recall** | Of actual X results, how many did the model correctly find? |
| **Confusion matrix** | Table showing predicted vs. actual outcomes for every class |
| **Logistic Regression** | Linear model that finds decision boundaries between classes |
| **Random Forest** | Ensemble of decision trees that vote on outcomes |
| **Gradient Boosting** | Sequential trees where each one fixes mistakes of previous trees |
| **Hyperparameters** | Settings you configure before training (e.g., number of trees, learning rate) |
| **Serialization** | Saving a trained model to disk using joblib so it can be loaded later |
| **API** | Interface that lets the frontend talk to the backend (we use REST with JSON) |
| **Flask** | Lightweight Python web framework for building the API |

---

*Built with real data from football-data.co.uk. Football is beautifully unpredictable — no model will ever be perfect, and that's what makes the game exciting.*
