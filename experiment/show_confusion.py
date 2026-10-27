"""v1 / v2 혼동행렬 비교 출력

사용법:  python show_confusion.py [결과폴더=results] [배치=10]
출력:    각 모델의 6x6 혼동행렬(행=실제, 열=모델이 답한 가스), 정답 합계,
         에탄올로 답한 비율, [가정: 에탄올=정상(OK)]일 때 불량 통과율
"""
import json
import sys
from pathlib import Path

NAMES = ["에탄올", "에틸렌", "암모니아", "아세트알데히드", "아세톤", "톨루엔"]


def show(model, batch, m):
    total = sum(map(sum, m))
    correct = sum(m[i][i] for i in range(6))
    print(f"\n=== {model}, 배치 {batch} (테스트 {total}개) ===")
    print("행=실제, 열=모델 답 (순서: " + ", ".join(NAMES) + ")")
    for i, row in enumerate(m):
        n = sum(row)
        rate = f"{row[i] / n:.0%}" if n else "-"
        print(f"{NAMES[i]:<8}", " ".join(f"{v:>5}" for v in row), f"| 맞힌 비율 {rate}")
    col_sums = [sum(r[j] for r in m) for j in range(6)]
    print("열 합계 ", " ".join(f"{v:>5}" for v in col_sums), "| (모델이 그렇게 답한 횟수)")
    print(f"정답 합계 {correct}/{total} = {correct / total:.4f}")
    print(f"에탄올로 답한 비율: {col_sums[0]}/{total} = {col_sums[0] / total:.0%}")

    # 가정: 에탄올 = 정상(OK), 그 외 가스 = 불량(NG)
    normal = sum(m[0])
    defect = total - normal
    passed = col_sums[0] - m[0][0]      # 불량인데 에탄올로 답해 OK가 된 것
    false_ng = normal - m[0][0]         # 정상인데 에탄올이 아니라고 답해 NG가 된 것
    print("[가정: 에탄올=정상(OK), 그 외=불량(NG)]")
    if defect:
        print(f"  불량 {defect}개 중 OK로 통과: {passed}개 ({passed / defect:.0%})")
    if normal:
        print(f"  정상 {normal}개 중 NG로 오판: {false_ng}개 ({false_ng / normal:.0%})")


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else "results")
    batch = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    data = json.load(open(folder / "confusion.json", encoding="utf-8"))
    for model in ("v1", "v2"):
        found = [x for x in data if x["model"] == model and x["batch"] == batch]
        if not found:
            print(f"{model}, 배치 {batch}: 결과 없음")
            continue
        show(model, batch, found[0]["matrix"])


if __name__ == "__main__":
    main()
