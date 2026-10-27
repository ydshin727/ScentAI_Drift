package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 6x6 confusion matrix stored as a JSON string (rows = actual gas, columns = predicted gas). */
@Entity
@Table(name = "confusion_matrix")
public class ConfusionMatrixRow {

    @Id
    private Integer id;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "batch_id")
    private Integer batchId;

    @Column(name = "n_test")
    private Integer nTest;

    @Column(name = "matrix_json", columnDefinition = "json")
    private String matrixJson;

    protected ConfusionMatrixRow() {
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

    public String getMatrixJson() {
        return matrixJson;
    }
}
