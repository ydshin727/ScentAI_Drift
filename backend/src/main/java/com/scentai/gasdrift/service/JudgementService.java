package com.scentai.gasdrift.service;

import com.scentai.gasdrift.domain.JudgementHistory;
import com.scentai.gasdrift.domain.SamplePrediction;
import com.scentai.gasdrift.dto.Dtos.HistoryDto;
import com.scentai.gasdrift.dto.Dtos.JudgementRequest;
import com.scentai.gasdrift.dto.Dtos.JudgementResponse;
import com.scentai.gasdrift.dto.Dtos.JudgementResult;
import com.scentai.gasdrift.dto.Dtos.PageDto;
import com.scentai.gasdrift.repository.JudgementHistoryRepository;
import com.scentai.gasdrift.repository.SamplePredictionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * OK/NG judgement. The rule is an assumption of this project (the dataset has no OK/NG labels):
 * OK when the predicted gas equals the chosen reference gas AND the model score >= threshold.
 * One request judges the same sample with both v1 and v2 and stores both results.
 */
@Service
public class JudgementService {

    private static final int GAS_COUNT = 6;
    private static final int PAGE_HARD_LIMIT = 100;

    private final SamplePredictionRepository sampleRepository;
    private final JudgementHistoryRepository historyRepository;

    public JudgementService(SamplePredictionRepository sampleRepository,
                            JudgementHistoryRepository historyRepository) {
        this.sampleRepository = sampleRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional
    public JudgementResponse judge(JudgementRequest request) {
        validate(request);

        SamplePrediction sample = sampleRepository.findById(request.sampleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sample not found: " + request.sampleId()));

        int referenceGas = request.referenceGas();
        BigDecimal threshold = BigDecimal.valueOf(request.threshold()).setScale(3, RoundingMode.HALF_UP);
        String expected = sample.getTrueLabel() == referenceGas ? "OK" : "NG";

        List<JudgementResult> results = new ArrayList<>();
        results.add(judgeOne(sample, "v1", sample.getV1Pred(), sample.getV1Score(),
                referenceGas, threshold, expected));
        results.add(judgeOne(sample, "v2", sample.getV2Pred(), sample.getV2Score(),
                referenceGas, threshold, expected));

        return new JudgementResponse(sample.getSampleId(), sample.getBatchId(), sample.getTrueLabel(),
                referenceGas, threshold.doubleValue(), expected, results);
    }

    public PageDto<HistoryDto> history(int page, int size) {
        int safeSize = Math.max(1, Math.min(size, PAGE_HARD_LIMIT));
        int safePage = Math.max(0, page);
        Page<JudgementHistory> result = historyRepository.findAll(
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id")));
        List<HistoryDto> items = result.getContent().stream()
                .map(h -> new HistoryDto(h.getId(), h.getSampleId(), h.getModelName(),
                        h.getPredictedLabel(), h.getScore().doubleValue(), h.getReferenceGas(),
                        h.getThreshold().doubleValue(), h.getResult(), h.getCreatedAt()))
                .toList();
        return new PageDto<>(items, safePage, safeSize, result.getTotalElements());
    }

    private JudgementResult judgeOne(SamplePrediction sample, String modelName, int predicted,
                                     BigDecimal score, int referenceGas, BigDecimal threshold,
                                     String expected) {
        boolean ok = predicted == referenceGas && score.compareTo(threshold) >= 0;
        String result = ok ? "OK" : "NG";
        historyRepository.save(new JudgementHistory(sample.getSampleId(), modelName, predicted,
                score, referenceGas, threshold, result));
        return new JudgementResult(modelName, predicted, score.doubleValue(), result,
                result.equals(expected));
    }

    private void validate(JudgementRequest request) {
        if (request == null || request.sampleId() == null
                || request.referenceGas() == null || request.threshold() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "sampleId, referenceGas and threshold are required");
        }
        if (request.referenceGas() < 1 || request.referenceGas() > GAS_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "referenceGas must be between 1 and " + GAS_COUNT);
        }
        if (request.threshold() < 0.0 || request.threshold() > 1.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "threshold must be between 0 and 1");
        }
    }
}
