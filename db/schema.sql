-- 가스 센서 드리프트 프로젝트 스키마 (MySQL 8)
-- docker-compose로 처음 기동할 때 자동 실행되고, 수동으로 여러 번 실행해도 안전하다.

SET NAMES utf8mb4;

-- 가스 라벨 (UCI 데이터셋의 1~6)
CREATE TABLE IF NOT EXISTS gas (
  label   TINYINT     NOT NULL PRIMARY KEY,
  name_en VARCHAR(30) NOT NULL,
  name_ko VARCHAR(30) NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO gas (label, name_en, name_ko) VALUES
  (1, 'Ethanol',      '에탄올'),
  (2, 'Ethylene',     '에틸렌'),
  (3, 'Ammonia',      '암모니아'),
  (4, 'Acetaldehyde', '아세트알데히드'),
  (5, 'Acetone',      '아세톤'),
  (6, 'Toluene',      '톨루엔');

-- 모델 버전
--   v1     : 배치 1 전체로 학습
--   v2     : 배치 1 + 대상 배치(k)의 20%로 재학습 (평가는 나머지 80%)
--   v1_cv5 : 배치 1 내부 5-fold 교차검증 (같은 시기 성능을 보는 참고선)
CREATE TABLE IF NOT EXISTS model_version (
  name        VARCHAR(20)  NOT NULL PRIMARY KEY,
  description VARCHAR(200) NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO model_version (name, description) VALUES
  ('v1',     '배치 1 전체로 학습한 RandomForest'),
  ('v2',     '배치 1 + 대상 배치의 20%로 재학습한 RandomForest (나머지 80%로 평가)'),
  ('v1_cv5', '배치 1 내부 5-fold 교차검증 정확도 (참고선, batch_id=1)');

-- 배치별 정확도
CREATE TABLE IF NOT EXISTS batch_accuracy (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(20)  NOT NULL,
  batch_id   TINYINT      NOT NULL,
  n_test     INT          NOT NULL,
  accuracy   DECIMAL(6,4) NOT NULL,
  UNIQUE KEY uq_acc_model_batch (model_name, batch_id),
  CONSTRAINT fk_acc_model FOREIGN KEY (model_name) REFERENCES model_version (name)
) DEFAULT CHARSET = utf8mb4;

-- 혼동행렬 (6x6, 행=실제 가스, 열=모델이 답한 가스, 라벨 1~6 순서)
CREATE TABLE IF NOT EXISTS confusion_matrix (
  id          INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  model_name  VARCHAR(20) NOT NULL,
  batch_id    TINYINT     NOT NULL,
  n_test      INT         NOT NULL,
  matrix_json JSON        NOT NULL,
  UNIQUE KEY uq_cm_model_batch (model_name, batch_id),
  CONSTRAINT fk_cm_model FOREIGN KEY (model_name) REFERENCES model_version (name)
) DEFAULT CHARSET = utf8mb4;

-- 테스트 샘플별 예측 (v1, v2 나란히). 적응용(학습에 쓴) 샘플은 들어 있지 않다.
CREATE TABLE IF NOT EXISTS sample_prediction (
  sample_id  INT          NOT NULL PRIMARY KEY,
  batch_id   TINYINT      NOT NULL,
  true_label TINYINT      NOT NULL,
  v1_pred    TINYINT      NOT NULL,
  v1_score   DECIMAL(5,4) NOT NULL,
  v2_pred    TINYINT      NOT NULL,
  v2_score   DECIMAL(5,4) NOT NULL,
  KEY idx_pred_batch (batch_id)
) DEFAULT CHARSET = utf8mb4;

-- PCA 2D 좌표 (배치 1로 fit, 전체 샘플 투영)
CREATE TABLE IF NOT EXISTS pca_point (
  sample_id INT     NOT NULL PRIMARY KEY,
  batch_id  TINYINT NOT NULL,
  label     TINYINT NOT NULL,
  pc1       DOUBLE  NOT NULL,
  pc2       DOUBLE  NOT NULL,
  KEY idx_pca_batch (batch_id)
) DEFAULT CHARSET = utf8mb4;

-- 판정 이력 (사이트의 '판정 테스트'에서 Spring이 기록)
--   판정 규칙(가정): 예측 가스 = 기준 가스 AND 모델 점수 >= 임계값 이면 OK, 아니면 NG
CREATE TABLE IF NOT EXISTS judgement_history (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sample_id       INT          NOT NULL,
  model_name      VARCHAR(20)  NOT NULL,
  predicted_label TINYINT      NOT NULL,
  score           DECIMAL(5,4) NOT NULL,
  reference_gas   TINYINT      NOT NULL,
  threshold       DECIMAL(4,3) NOT NULL,
  result          ENUM('OK', 'NG') NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_hist_created (created_at),
  CONSTRAINT fk_hist_model FOREIGN KEY (model_name) REFERENCES model_version (name)
) DEFAULT CHARSET = utf8mb4;

-- 실험 설정 (meta.json 한 건)
CREATE TABLE IF NOT EXISTS experiment_meta (
  id        TINYINT NOT NULL PRIMARY KEY,
  meta_json JSON    NOT NULL
) DEFAULT CHARSET = utf8mb4;
