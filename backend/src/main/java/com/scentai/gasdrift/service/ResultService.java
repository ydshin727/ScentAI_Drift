package com.scentai.gasdrift.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scentai.gasdrift.domain.PcaPoint;
import com.scentai.gasdrift.domain.SamplePrediction;
import com.scentai.gasdrift.dto.Dtos.AccuracyDto;
import com.scentai.gasdrift.dto.Dtos.ConfusionDto;
import com.scentai.gasdrift.dto.Dtos.GasDto;
import com.scentai.gasdrift.dto.Dtos.MetaDto;
import com.scentai.gasdrift.dto.Dtos.PageDto;
import com.scentai.gasdrift.dto.Dtos.PcaPointDto;
import com.scentai.gasdrift.dto.Dtos.SampleDto;
import com.scentai.gasdrift.repository.BatchAccuracyRepository;
import com.scentai.gasdrift.repository.ConfusionMatrixRepository;
import com.scentai.gasdrift.repository.ExperimentMetaRepository;
import com.scentai.gasdrift.repository.GasRepository;
import com.scentai.gasdrift.repository.PcaPointRepository;
import com.scentai.gasdrift.repository.SamplePredictionRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only queries for the experiment results. */
@Service
@Transactional(readOnly = true)
public class ResultService {

    private static final int MAX_BATCH = 10;
    private static final int PCA_HARD_LIMIT = 2000;
    private static final int PAGE_HARD_LIMIT = 100;

    private final BatchAccuracyRepository accuracyRepository;
    private final ConfusionMatrixRepository confusionRepository;
    private final SamplePredictionRepository sampleRepository;
    private final PcaPointRepository pcaRepository;
    private final GasRepository gasRepository;
    private final ExperimentMetaRepository metaRepository;

    // Spring Boot 4 auto-configures a Jackson 3 mapper (tools.jackson), not this Jackson 2 type,
    // so we create our own instance for parsing the JSON columns instead of injecting one.
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResultService(BatchAccuracyRepository accuracyRepository,
                         ConfusionMatrixRepository confusionRepository,
                         SamplePredictionRepository sampleRepository,
                         PcaPointRepository pcaRepository,
                         GasRepository gasRepository,
                         ExperimentMetaRepository metaRepository) {
        this.accuracyRepository = accuracyRepository;
        this.confusionRepository = confusionRepository;
        this.sampleRepository = sampleRepository;
        this.pcaRepository = pcaRepository;
        this.gasRepository = gasRepository;
        this.metaRepository = metaRepository;
    }

    public List<AccuracyDto> accuracy() {
        return accuracyRepository.findAllByOrderByBatchIdAscModelNameAsc().stream()
                .map(a -> new AccuracyDto(a.getModelName(), a.getBatchId(), a.getNTest(),
                        a.getAccuracy().doubleValue()))
                .toList();
    }

    public List<ConfusionDto> confusion() {
        return confusionRepository.findAllByOrderByBatchIdAscModelNameAsc().stream()
                .map(c -> new ConfusionDto(c.getModelName(), c.getBatchId(), c.getNTest(),
                        parseMatrix(c.getMatrixJson())))
                .toList();
    }

    /**
     * PCA points for the given batches (all batches when none given), thinned to at most
     * maxPerBatch evenly spaced points per batch so the scatter plot stays responsive.
     */
    public List<PcaPointDto> pca(List<Integer> batches, int maxPerBatch) {
        List<Integer> targets = (batches == null || batches.isEmpty())
                ? IntStream.rangeClosed(1, MAX_BATCH).boxed().toList()
                : batches;
        int cap = Math.max(1, Math.min(maxPerBatch, PCA_HARD_LIMIT));

        List<PcaPointDto> out = new ArrayList<>();
        for (Integer batch : targets) {
            List<PcaPoint> points = pcaRepository.findByBatchIdOrderBySampleId(batch);
            int n = points.size();
            if (n == 0) {
                continue;
            }
            if (n <= cap) {
                points.forEach(p -> out.add(toPcaDto(p)));
            } else {
                double step = (double) n / cap;
                for (int i = 0; i < cap; i++) {
                    out.add(toPcaDto(points.get((int) (i * step))));
                }
            }
        }
        return out;
    }

    public PageDto<SampleDto> samples(Integer batch, Integer label, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, PAGE_HARD_LIMIT));
        int safePage = Math.max(0, page);
        Page<SamplePrediction> result = sampleRepository.search(
                batch, label, PageRequest.of(safePage, safeSize, Sort.by("sampleId")));
        List<SampleDto> items = result.getContent().stream().map(this::toSampleDto).toList();
        return new PageDto<>(items, safePage, safeSize, result.getTotalElements());
    }

    public MetaDto meta() {
        List<GasDto> gases = gasRepository.findAll(Sort.by("label")).stream()
                .map(g -> new GasDto(g.getLabel(), g.getNameEn(), g.getNameKo()))
                .toList();
        Map<String, Object> experiment = metaRepository.findById(1)
                .map(m -> parseMap(m.getMetaJson()))
                .orElse(null);
        return new MetaDto(gases, experiment);
    }

    private PcaPointDto toPcaDto(PcaPoint p) {
        return new PcaPointDto(p.getSampleId(), p.getBatchId(), p.getLabel(), p.getPc1(), p.getPc2());
    }

    private SampleDto toSampleDto(SamplePrediction s) {
        return new SampleDto(s.getSampleId(), s.getBatchId(), s.getTrueLabel(),
                s.getV1Pred(), s.getV1Score().doubleValue(),
                s.getV2Pred(), s.getV2Score().doubleValue());
    }

    private int[][] parseMatrix(String json) {
        try {
            return objectMapper.readValue(json, int[][].class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse confusion matrix JSON", e);
        }
    }

    private Map<String, Object> parseMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse experiment meta JSON", e);
        }
    }
}
