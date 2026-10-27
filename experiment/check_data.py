"""UCI Gas Sensor Array Drift 데이터 로드·검증 스크립트

사용법:  python check_data.py [데이터폴더]
        (기본 폴더: ./data, 안에 batch1.dat ~ batch10.dat)
결과:   배치별 샘플 수 / 가스별 개수 / 결측·파싱 오류를 출력하고
        gas_drift.npz (X, y, batch) 로 저장한다.

라인 형식 (두 가지 모두 처리):
    1 1:15596.16 2:1.868 ...        (라벨 뒤 공백, 특징은 번호:값)
    1;10.000000 1:15596.16 ...      (라벨;농도 뒤 특징)
"""
import sys
from pathlib import Path

import numpy as np

N_FEATURES = 128
GAS = {1: "Ethanol", 2: "Ethylene", 3: "Ammonia",
       4: "Acetaldehyde", 5: "Acetone", 6: "Toluene"}


def parse_line(line):
    tokens = line.split()
    label = int(float(tokens[0].split(";")[0]))
    feats = np.full(N_FEATURES, np.nan)
    for t in tokens[1:]:
        k, v = t.split(":")
        idx = int(k) - 1
        if 0 <= idx < N_FEATURES:
            feats[idx] = float(v)
    return label, feats


def load_batch(path):
    X, y, bad = [], [], 0
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                label, feats = parse_line(line)
            except Exception:
                bad += 1
                continue
            y.append(label)
            X.append(feats)
    return np.array(X), np.array(y), bad


def main():
    data_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "data")
    Xs, ys, bs = [], [], []

    header = "배치 | 샘플수 | " + " ".join(f"{GAS[g][:5]:>6}" for g in GAS) + " | NaN | 파싱오류"
    print(header)
    print("-" * len(header))

    for b in range(1, 11):
        path = data_dir / f"batch{b}.dat"
        if not path.exists():
            print(f"{b:>4} | 파일 없음: {path}")
            continue
        X, y, bad = load_batch(path)
        counts = [int((y == g).sum()) for g in GAS]
        nan_cnt = int(np.isnan(X).sum()) if len(X) else 0
        print(f"{b:>4} | {len(y):>6} | " + " ".join(f"{c:>6}" for c in counts)
              + f" | {nan_cnt:>3} | {bad:>4}")
        Xs.append(X)
        ys.append(y)
        bs.append(np.full(len(y), b))

    if not Xs:
        print("읽은 파일이 없습니다. 폴더 경로와 파일명을 확인하세요.")
        return

    X, y, batch = np.vstack(Xs), np.concatenate(ys), np.concatenate(bs)
    print("-" * len(header))
    print(f"전체 샘플: {len(y)} (기대값 13910), 특징 수: {X.shape[1]} (기대값 128)")
    print(f"라벨 종류: {sorted(set(y.tolist()))} (기대값 1~6)")
    print(f"특징값 범위: min={np.nanmin(X):.3f}, max={np.nanmax(X):.3f}")

    np.savez("gas_drift.npz", X=X, y=y, batch=batch)
    print("저장 완료: gas_drift.npz")


if __name__ == "__main__":
    main()
