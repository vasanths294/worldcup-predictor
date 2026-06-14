# World Cup 2026 Predictor — Daily Workflow

## SETUP (done once)
Run in order:
1. 01_download_data.ipynb
2. 02_clean_and_explore.ipynb
3. 03_elo_ratings.ipynb
4. 04_feature_engineering.ipynb
5. 05_train_model.ipynb

---

## BEFORE EVERY MATCH DAY
1. Open 08_predict.ipynb
2. In Cell 5, uncomment the current matchday date range
3. Run all cells
4. git add docs/ && git commit -m "Matchday X predictions" && git push

## AFTER EVERY MATCH DAY
1. Open data/raw/wc2026_results.csv
2. Fill home_score and away_score for finished matches
3. Save the CSV
4. Open 07_enter_results.ipynb
5. Run all cells — Elo updates automatically
6. git add data/raw/wc2026_results.csv && git commit -m "Day X results" && git push

---

## AFTER MATCHDAY COMPLETE (all matches in that matchday done)
1. Open 05_train_model.ipynb
2. Run all cells — model retrains on historical + new WC results
3. Open 08_predict.ipynb
4. Uncomment NEXT matchday in Cell 5
5. Run all cells
6. git add . && git commit -m "Retrain + Matchday X+1 predictions" && git push

---

## MATCHDAY SCHEDULE
| Matchday   | Dates           | Retrain after? |
|------------|-----------------|----------------|
| Matchday 1 | Jun 11 - Jun 17 | YES            |
| Matchday 2 | Jun 18 - Jun 23 | YES            |
| Matchday 3 | Jun 24 - Jun 27 | YES            |
| Round of 32| Jun 28 - Jul 03 | YES            |
| Round of 16| Jul 04 - Jul 07 | YES            |
| Quarterfinal| Jul 09 - Jul 11| YES            |
| Semifinal  | Jul 14 - Jul 15 | YES            |
| Final      | Jul 19          | NO             |

---

## FILE STRUCTURE
data/raw/wc2026_results.csv     <- YOU FILL THIS after each match
data/raw/wc2026_schedule.csv    <- full schedule with cities
data/processed/                 <- auto-generated, never edited manually
data/predictions/               <- prediction JSON files
docs/predictions/               <- same files, served by GitHub Pages
models/                         <- trained model files
