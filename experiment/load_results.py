"""실험 결과(results/)를 MySQL에 적재한다. 여러 번 실행해도 안전하다(기존 결과 삭제 후 재적재).
judgement_history(판정 이력)는 건드리지 않는다.

사용법:
    pip install pymysql cryptography      # MySQL 8 기본 인증(caching_sha2_password)에 cryptography 필요
    python load_results.py [결과폴더=results] [--dry-run]
    (접속 정보 기본값은 docker-compose.yml과 같다. 바꾸려면 --host/--port/--user/--database
     옵션이나 환경변수 GASDRIFT_DB_PASSWORD 를 사용)

--dry-run: DB에 접속하지 않고 읽은 행 수와 예시만 출력한다.
"""
import argparse
import csv
import json
import os
import sys
from pathlib import Path

CHUNK = 1000


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def prepare(results: Path):
    acc = [(r["model"], int(r["batch"]), int(r["n_test"]), float(r["accuracy"]))
           for r in read_csv(results / "accuracy.csv")]

    with open(results / "confusion.json", encoding="utf-8") as f:
        conf = [(c["model"], int(c["batch"]), int(c["n_test"]), json.dumps(c["matrix"]))
                for c in json.load(f)]

    pred = [(int(r["sample_id"]), int(r["batch"]), int(r["true_label"]),
             int(r["v1_pred"]), float(r["v1_score"]),
             int(r["v2_pred"]), float(r["v2_score"]))
            for r in read_csv(results / "predictions.csv")]

    pca = [(int(r["sample_id"]), int(r["batch"]), int(r["label"]),
            float(r["pc1"]), float(r["pc2"]))
           for r in read_csv(results / "pca.csv")]

    with open(results / "meta.json", encoding="utf-8") as f:
        meta = json.dumps(json.load(f), ensure_ascii=False)

    return {"batch_accuracy": acc, "confusion_matrix": conf,
            "sample_prediction": pred, "pca_point": pca, "meta": meta}


SQL = {
    "batch_accuracy": "INSERT INTO batch_accuracy (model_name, batch_id, n_test, accuracy) "
                      "VALUES (%s, %s, %s, %s)",
    "confusion_matrix": "INSERT INTO confusion_matrix (model_name, batch_id, n_test, matrix_json) "
                        "VALUES (%s, %s, %s, %s)",
    "sample_prediction": "INSERT INTO sample_prediction "
                         "(sample_id, batch_id, true_label, v1_pred, v1_score, v2_pred, v2_score) "
                         "VALUES (%s, %s, %s, %s, %s, %s, %s)",
    "pca_point": "INSERT INTO pca_point (sample_id, batch_id, label, pc1, pc2) "
                 "VALUES (%s, %s, %s, %s, %s)",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("results", nargs="?", default="results")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=3307)  # docker-compose.yml의 호스트 포트
    ap.add_argument("--user", default="gasdrift")
    ap.add_argument("--database", default="gasdrift")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    data = prepare(Path(args.results))
    print("읽은 행 수:")
    for name in SQL:
        print(f"  {name:<18} {len(data[name]):>6}")
    print(f"  {'experiment_meta':<18} {1:>6}")

    if args.dry_run:
        print("\n[dry-run] 예시 1행씩")
        for name in SQL:
            print(f"  {name}: {data[name][0]}")
        print("DB에는 접속하지 않았습니다.")
        return

    import pymysql  # 지연 import: dry-run에는 필요 없음

    password = os.environ.get("GASDRIFT_DB_PASSWORD", "gasdrift1234")
    try:
        conn = pymysql.connect(host=args.host, port=args.port, user=args.user,
                               password=password, database=args.database,
                               charset="utf8mb4", autocommit=False)
    except pymysql.err.OperationalError as e:
        print(f"\nDB 접속 실패: {e}")
        print("확인할 것:")
        print("  1) docker compose ps 에서 gasdrift-mysql 이 healthy 인지")
        print(f"  2) 포트 {args.port} 에 응답하는 것이 이 프로젝트의 컨테이너인지 (다른 MySQL이 아닌지)")
        print("  3) 예전에 다른 비밀번호로 만든 볼륨이 남아 있으면: docker compose down -v 후 다시 up")
        return 1
    try:
        with conn.cursor() as cur:
            # 기존 결과 삭제 (판정 이력은 유지)
            for table in ("batch_accuracy", "confusion_matrix", "sample_prediction",
                          "pca_point", "experiment_meta"):
                cur.execute(f"DELETE FROM {table}")

            for name, sql in SQL.items():
                rows = data[name]
                for i in range(0, len(rows), CHUNK):
                    cur.executemany(sql, rows[i:i + CHUNK])

            cur.execute("INSERT INTO experiment_meta (id, meta_json) VALUES (1, %s)",
                        (data["meta"],))
        conn.commit()

        print("\n적재 완료. 테이블별 행 수 확인:")
        with conn.cursor() as cur:
            for table in list(SQL) + ["experiment_meta"]:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                print(f"  {table:<18} {cur.fetchone()[0]:>6}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
