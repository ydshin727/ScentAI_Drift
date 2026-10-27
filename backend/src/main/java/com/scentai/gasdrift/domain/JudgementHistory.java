package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One OK/NG judgement. Rule (an assumption of this project):
 * OK when predicted gas == reference gas AND score >= threshold, otherwise NG.
 */
@Entity
@Table(name = "judgement_history")
public class JudgementHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sample_id")
    private Integer sampleId;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "predicted_label")
    private Integer predictedLabel;

    @Column(name = "score")
    private BigDecimal score;

    @Column(name = "reference_gas")
    private Integer referenceGas;

    @Column(name = "threshold")
    private BigDecimal threshold;

    @Column(name = "result")
    private String result;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    protected JudgementHistory() {
    }

    public JudgementHistory(Integer sampleId, String modelName, Integer predictedLabel, BigDecimal score,
                            Integer referenceGas, BigDecimal threshold, String result) {
        this.sampleId = sampleId;
        this.modelName = modelName;
        this.predictedLabel = predictedLabel;
        this.score = score;
        this.referenceGas = referenceGas;
        this.threshold = threshold;
        this.result = result;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Integer getSampleId() {
        return sampleId;
    }

    public String getModelName() {
        return modelName;
    }

    public Integer getPredictedLabel() {
        return predictedLabel;
    }

    public BigDecimal getScore() {
        return score;
    }

    public Integer getReferenceGas() {
        return referenceGas;
    }

    public BigDecimal getThreshold() {
        return threshold;
    }

    public String getResult() {
        return result;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
