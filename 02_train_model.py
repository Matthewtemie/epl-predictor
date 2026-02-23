"""
=============================================================================
STEP 2: MODEL TRAINING & EVALUATION
=============================================================================

This script:
1. Loads the prepared training data
2. Splits it into training and testing sets
3. Trains a Random Forest classifier
4. Evaluates how well it performs
5. Saves the trained model for the web app

KEY ML CONCEPTS EXPLAINED:
- "Training Set" = data the model learns from (~80% of data)
- "Test Set"     = data we hide from the model to check if it actually learned 
                   generalizable patterns (~20% of data)
- "Overfitting"  = when a model memorizes training data but fails on new data
- "Random Forest" = an ensemble of decision trees that vote on the outcome
- "Accuracy"     = percentage of correct predictions
- "Classification Report" = detailed breakdown of precision, recall, F1 per class
"""

import pandas as pd
import numpy as np
import json
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# ============================================================================
# PART A: LOAD AND PREPARE DATA
# ============================================================================

print("=" * 60)
print("STEP 1: Loading Data")
print("=" * 60)

df = pd.read_csv("training_data.csv")
print(f"Loaded {len(df)} matches with {len(df.columns)-1} features")

# Separate features (X) from target (y)
# This is a fundamental ML concept:
#   X = what the model sees (the inputs)
#   y = what the model tries to predict (the output)
feature_cols = [c for c in df.columns if c != "result"]
X = df[feature_cols]
y = df["result"]

print(f"\nFeature matrix shape: {X.shape}")
print(f"Target vector shape:  {y.shape}")


# ============================================================================
# PART B: TRAIN/TEST SPLIT
# ============================================================================
# WHY split the data?
# Imagine studying for an exam with the answer key. You'd score 100%, 
# but you didn't really *learn* the material. Similarly, if we test our
# model on the same data it trained on, we can't tell if it truly learned
# useful patterns or just memorized everything.
#
# Solution: Hide 20% of the data, train on 80%, then test on the hidden 20%.

print("\n" + "=" * 60)
print("STEP 2: Splitting Data into Train/Test Sets")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,       # 20% for testing
    random_state=42,     # For reproducibility (same split every time)
    stratify=y           # Keep the same ratio of H/D/A in both sets
)

print(f"Training set: {len(X_train)} matches")
print(f"Testing set:  {len(X_test)} matches")


# ============================================================================
# PART C: FEATURE SCALING
# ============================================================================
# WHY scale features?
# Some features have large values (e.g., shots: 10-20) while others are 
# small (e.g., win rate: 0.0-1.0). Some models work better when all 
# features are on a similar scale. StandardScaler transforms each feature 
# to have mean=0 and standard deviation=1.

print("\n" + "=" * 60)
print("STEP 3: Scaling Features")
print("=" * 60)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # Learn scaling from train data
X_test_scaled = scaler.transform(X_test)         # Apply same scaling to test data
# ↑ IMPORTANT: We only "fit" on training data to avoid data leakage!

print("Features scaled to mean=0, std=1")
print(f"Example — before scaling: {X_train.iloc[0].values[:3]}")
print(f"Example — after scaling:  {X_train_scaled[0][:3]}")


# ============================================================================
# PART D: TRAIN MULTIPLE MODELS
# ============================================================================
# We'll try 3 different algorithms and pick the best one.
# This is called "model selection" — a key part of any ML project.

print("\n" + "=" * 60)
print("STEP 4: Training Models")
print("=" * 60)

models = {
    # LOGISTIC REGRESSION
    # The simplest classification algorithm. Draws a straight line (or plane)
    # to separate classes. Fast and interpretable.
    "Logistic Regression": LogisticRegression(
        max_iter=1000,
        random_state=42,
    ),

    # RANDOM FOREST
    # Creates many decision trees, each seeing a random subset of data,
    # then takes a vote. Like asking 100 football pundits and going with
    # the majority opinion.
    "Random Forest": RandomForestClassifier(
        n_estimators=200,      # Number of trees (more = better, but slower)
        max_depth=12,          # How deep each tree can grow
        min_samples_split=10,  # Min matches needed to split a node
        min_samples_leaf=5,    # Min matches in each leaf
        random_state=42,
        n_jobs=-1              # Use all CPU cores
    ),

    # GRADIENT BOOSTING
    # Builds trees sequentially, where each new tree tries to fix the 
    # mistakes of the previous ones. Often the most accurate.
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,     # How much each tree contributes
        random_state=42
    ),
}

results = {}
for name, model in models.items():
    print(f"\n Training {name}...")

    # Cross-validation: Train and test multiple times on different splits
    # This gives a more reliable estimate of performance
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring="accuracy")
    print(f"  Cross-validation accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Train on full training set
    model.fit(X_train_scaled, y_train)

    # Predict on test set
    y_pred = model.predict(X_test_scaled)
    test_acc = accuracy_score(y_test, y_pred)
    print(f"  Test accuracy: {test_acc:.4f}")

    results[name] = {
        "model": model,
        "cv_mean": cv_scores.mean(),
        "cv_std": cv_scores.std(),
        "test_acc": test_acc,
        "y_pred": y_pred,
    }


# ============================================================================
# PART E: EVALUATE THE BEST MODEL
# ============================================================================

print("\n" + "=" * 60)
print("STEP 5: Model Comparison & Evaluation")
print("=" * 60)

# Find the best model
best_name = max(results, key=lambda k: results[k]["test_acc"])
best = results[best_name]

print("\n Model Comparison:")
print(f"{'Model':<25s} {'CV Accuracy':>12s} {'Test Accuracy':>14s}")
print("-" * 55)
for name, r in results.items():
    marker = "  BEST" if name == best_name else ""
    print(f"{name:<25s} {r['cv_mean']:.4f} ± {r['cv_std']:.4f}  {r['test_acc']:.4f}{marker}")

# Detailed report for the best model
print(f"\n{'=' * 60}")
print(f"Detailed Report: {best_name}")
print(f"{'=' * 60}")

label_names = ["Home Win", "Draw", "Away Win"]
print("\nClassification Report:")
print(classification_report(y_test, best["y_pred"], target_names=label_names))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, best["y_pred"])
print(f"{'':>15s} Predicted:")
print(f"{'':>15s} {'Home':>8s} {'Draw':>8s} {'Away':>8s}")
for i, label in enumerate(label_names):
    print(f"  Actual {label:>8s}: {cm[i][0]:>6d}   {cm[i][1]:>6d}   {cm[i][2]:>6d}")


# ============================================================================
# PART F: FEATURE IMPORTANCE
# ============================================================================
# Which features matter most? Random Forest can tell us!

if best_name in ["Random Forest", "Gradient Boosting"]:
    print(f"\n{'=' * 60}")
    print(f"Feature Importance (which inputs matter most)")
    print(f"{'=' * 60}")

    importances = best["model"].feature_importances_
    feat_imp = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)

    for feat, imp in feat_imp[:10]:
        bar = "█" * int(imp * 200)
        print(f"  {feat:>30s}: {imp:.4f} {bar}")


# ============================================================================
# PART G: SAVE THE MODEL
# ============================================================================
# We serialize (save) the trained model so our web app can load it later
# without retraining every time.

print(f"\n{'=' * 60}")
print(f"STEP 6: Saving Model & Artifacts")
print(f"{'=' * 60}")

# Save the best model
joblib.dump(best["model"], "model.joblib")
joblib.dump(scaler, "scaler.joblib")
joblib.dump(feature_cols, "feature_cols.joblib")

# Save model metadata
metadata = {
    "model_type": best_name,
    "test_accuracy": float(best["test_acc"]),
    "cv_accuracy": float(best["cv_mean"]),
    "n_features": len(feature_cols),
    "n_training_samples": len(X_train),
    "feature_names": feature_cols,
    "classes": label_names,
}
with open("model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f" Saved:")
print(f"  → model.joblib (trained {best_name})")
print(f"  → scaler.joblib (feature scaler)")
print(f"  → feature_cols.joblib (feature names)")
print(f"  → model_metadata.json (metadata)")

print(f"\n Model training complete!")
print(f"   Best model: {best_name} with {best['test_acc']:.1%} accuracy")