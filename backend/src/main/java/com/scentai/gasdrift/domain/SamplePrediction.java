package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** Held-out test sample with the v1 and v2 predictions (samples used to train v2 are not included). */
@Entity
@Table(name = "sample_prediction")
public class SamplePrediction {

    @Id
    @Column(name = "sample_id")
    private Integer sampleId;

    @Column(name = "batch_id")
    private Integer batchId;

    @Column(name = "true_label")
    private Integer trueLabel;

    @Column(name = "v1_pred")
    private Integer v1Pred;

    @Column(name = "v1_score")
    private BigDecimal v1Score;

    @Column(name = "v2_pred")
    private Integer v2Pred;

    @Column(name = "v2_score")
    private BigDecimal v2Score;

    protected SamplePrediction() {
    }

    public Integer getSampleId() {
        return sampleId;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public Integer getTrueLabel() {
        return trueLabel;
    }

    public Integer getV1Pred() {
        return v1Pred;
    }

    public BigDecimal getV1Score() {
        return v1Score;
    }

    public Integer getV2Pred() {
        return v2Pred;
    }

    public BigDecimal getV2Score() {
        return v2Score;
    }
}
