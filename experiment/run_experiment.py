"""실험 스크립트: v1(배치1 학습) vs v2(배치1 + 새 배치 일부로 재학습)

사용법:  python run_experiment.py [npz경로=gas_drift.npz] [출력폴더=results]
필요:    pip install numpy scikit-learn

설계
- v1 : 배치 1 전체로 학습 (RandomForest 기본값, random_state=42)
- 배치 k(2~10)마다 가스별 비율을 유지해 20%(적응용) / 80%(테스트용)로 나눈다.
- v2_k: 배치 1 + 배치 k의 적응용 20%로 재학습
- v1과 v2_k를 '같은 80% 테스트 샘플'로 평가한다.
  (적응용 샘플은 테스트에서 제외 = 데이터 누수 방지)
- 참고선: 배치 1 안에서의 5-fold 교차검증 정확도 (같은 시기에서의 성능)
- PCA 시각화: 배치 1로만 표준화·PCA를 fit하고 모든 배치를 같은 좌표로 투영한다.

출력 (출력폴더):
    accuracy.csv     model, batch, n_test, accuracy
    confusion.json   모델/배치별 6x6 혼동행렬 (행=실제, 열=예측, 라벨 1~6 고정)
    predictions.csv  테스트 샘플별 정답, v1/v2 예측과 모델 점수
    pca.csv          전체 샘플의 PCA 2D 좌표
    meta.json        실험 설정과 PCA 설명 분산 비율
"""
import csv
import json
import sys
from pathlib import Path

import numpy as np
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

LABELS = [1, 2, 3, 4, 5, 6]
GAS = {1: "Ethanol", 2: "Ethylene", 3: "Ammonia",
       4: "Acetaldehyde", 5: "Acetone", 6: "Toluene"}
ADAPT_RATIO = 0.2
SEED = 42
N_TREES = 100


def make_rf():
    return RandomForestClassifier(n_estimators=N_TREES, random_state=SEED, n_jobs=-1)


def predict_with_score(model, X):
    """예측 가스와 모델 점수(해당 가스에 대한 트리 평균 확률)를 반환."""
    proba = model.predict_proba(X)
    top = proba.argmax(axis=1)
    return model.classes_[top], proba[np.arange(len(top)), top]


def write_csv(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def main():
    npz = sys.argv[1] if len(sys.argv) > 1 else "gas_drift.npz"
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "results")
    out.mkdir(parents=True, exist_ok=True)

    d = np.load(npz)
    X, y, batch = d["X"], d["y"], d["batch"]
    print(f"로드: {X.shape[0]}샘플, 특징 {X.shape[1]}개, 배치 {sorted(set(batch.tolist()))}")

    # ---- v1: 배치 1로만 학습 ----
    m1 = batch == 1
    X1, y1 = X[m1], y[m1]
    v1 = make_rf().fit(X1, y1)
    cv_acc = cross_val_score(
        make_rf(), X1, y1,
        cv=StratifiedKFold(5, shuffle=True, random_state=SEED), scoring="accuracy",
    ).mean()
    print(f"[참고] 배치 1 내부 5-fold 교차검증 정확도: {cv_acc:.4f}")

    acc_rows = [["v1_cv5", 1, len(y1), round(float(cv_acc), 4)]]
    conf_list, pred_rows, summary = [], [], []

    # ---- 배치 2~10: 20/80 분할 후 v1, v2_k 평가 ----
    for k in range(2, 11):
        idx = np.where(batch == k)[0]
        try:
            adapt_idx, test_idx = train_test_split(
                idx, train_size=ADAPT_RATIO, stratify=y[idx], random_state=SEED)
        except ValueError:  # 가스별 샘플이 너무 적어 층화 불가
            adapt_idx, test_idx = train_test_split(
                idx, train_size=ADAPT_RATIO, random_state=SEED)

        v2 = make_rf().fit(np.vstack([X1, X[adapt_idx]]),
                           np.concatenate([y1, y[adapt_idx]]))

        y_true = y[test_idx]
        res = {}
        for name, model in (("v1", v1), ("v2", v2)):
            pred, score = predict_with_score(model, X[test_idx])
            acc = accuracy_score(y_true, pred)
            cm = confusion_matrix(y_true, pred, labels=LABELS)
            res[name] = (pred, score, acc)
            acc_rows.append([name, k, len(test_idx), round(float(acc), 4)])
            conf_list.append({"model": name, "batch": k, "n_test": int(len(test_idx)),
                              "labels": LABELS, "matrix": cm.tolist()})

        for i, sid in enumerate(test_idx):
            pred_rows.append([
                int(sid), k, int(y_true[i]),
                int(res["v1"][0][i]), round(float(res["v1"][1][i]), 4),
                int(res["v2"][0][i]), round(float(res["v2"][1][i]), 4),
            ])
        summary.append((k, len(adapt_idx), len(test_idx), res["v1"][2], res["v2"][2]))

    # ---- PCA 2D (배치 1로 fit, 전체 투영) ----
    scaler = StandardScaler().fit(X1)
    pca = PCA(n_components=2, random_state=SEED).fit(scaler.transform(X1))
    Z = pca.transform(scaler.transform(X))
    ev = [round(float(v), 4) for v in pca.explained_variance_ratio_]

    # ---- 저장 ----
    write_csv(out / "accuracy.csv", ["model", "batch", "n_test", "accuracy"], acc_rows)
    with open(out / "confusion.json", "w", encoding="utf-8") as f:
        json.dump(conf_list, f, ensure_ascii=False)
    write_csv(out / "predictions.csv",
              ["sample_id", "batch", "true_label", "v1_pred", "v1_score", "v2_pred", "v2_score"],
              pred_rows)
    write_csv(out / "pca.csv", ["sample_id", "batch", "label", "pc1", "pc2"],
              [[i, int(batch[i]), int(y[i]), round(float(Z[i, 0]), 4), round(float(Z[i, 1]), 4)]
               for i in range(len(y))])
    with open(out / "meta.json", "w", encoding="utf-8") as f:
        json.dump({
            "model": "RandomForestClassifier", "n_estimators": N_TREES, "random_state": SEED,
            "adapt_ratio": ADAPT_RATIO, "v1_train": "batch 1", "v2_train": "batch 1 + 20% of batch k",
            "batch1_cv5_accuracy": round(float(cv_acc), 4),
            "pca_fit_on": "batch 1 (StandardScaler + PCA)", "pca_explained_variance_ratio": ev,
            "gas_labels": {str(k): v for k, v in GAS.items()},
        }, f, ensure_ascii=False, indent=2)

    # ---- 요약 출력 ----
    print("\n배치 | 적응용 | 테스트 |  v1 정확도 |  v2 정확도 |   차이")
    print("-" * 58)
    for k, na, nt, a1, a2 in summary:
        flag = "  *표본 적음" if nt < 200 else ""
        print(f"{k:>4} | {na:>6} | {nt:>6} | {a1:>10.4f} | {a2:>10.4f} | {a2 - a1:>+7.4f}{flag}")
    print(f"\nPCA 설명 분산 비율: PC1={ev[0]}, PC2={ev[1]}")
    print(f"저장 완료: {out}/ (accuracy.csv, confusion.json, predictions.csv, pca.csv, meta.json)")


if __name__ == "__main__":
    main()
