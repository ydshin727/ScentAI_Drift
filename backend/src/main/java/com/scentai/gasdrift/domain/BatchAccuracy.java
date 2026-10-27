package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** Accuracy per model and batch. model_name 'v1_cv5' is the batch-1 cross-validation baseline. */
@Entity
@Table(name = "batch_accuracy")
public class BatchAccuracy {

    @Id
    private Integer id;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "batch_id")
    private Integer batchId;

    @Column(name = "n_test")
    private Integer nTest;

    @Column(name = "accuracy")
    private BigDecimal accuracy;

    protected BatchAccuracy() {
    }

    public String getModelName() {
        return modelName;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public Integer getNTest() {
        return nTest;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }
}
