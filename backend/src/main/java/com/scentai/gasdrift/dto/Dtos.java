package com.scentai.gasdrift.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Response and request shapes of the REST API. */
public final class Dtos {

    private Dtos() {
    }

    public record AccuracyDto(String modelName, int batchId, int nTest, double accuracy) {
    }

    /** matrix[i][j]: number of samples whose actual gas is label i+1 and predicted gas is label j+1. */
    public record ConfusionDto(String modelName, int batchId, int nTest, int[][] matrix) {
    }

    public record PcaPointDto(int sampleId, int batchId, int label, double pc1, double pc2) {
    }

    public record SampleDto(int sampleId, int batchId, int trueLabel,
                            int v1Pred, double v1Score, int v2Pred, double v2Score) {
    }

    public record PageDto<T>(List<T> items, int page, int size, long total) {
    }

    public record GasDto(int label, String nameEn, String nameKo) {
    }

    /** experiment: parsed meta.json as plain maps/lists (no Jackson type, so any Jackson version can serialize it). */
    public record MetaDto(List<GasDto> gases, Map<String, Object> experiment) {
    }

    public record JudgementRequest(Integer sampleId, Integer referenceGas, Double threshold) {
    }

    public record JudgementResult(String modelName, int predictedLabel, double score,
                                  String result, boolean correct) {
    }

    /** expectedResult: the OK/NG a perfect model would give under the chosen reference gas. */
    public record JudgementResponse(int sampleId, int batchId, int trueLabel, int referenceGas,
                                    double threshold, String expectedResult,
                                    List<JudgementResult> results) {
    }

    public record HistoryDto(long id, int sampleId, String modelName, int predictedLabel, double score,
                             int referenceGas, double threshold, String result, LocalDateTime createdAt) {
    }
}
