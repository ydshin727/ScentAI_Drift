package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 2D PCA coordinate (PCA fitted on batch 1 only, all samples projected). */
@Entity
@Table(name = "pca_point")
public class PcaPoint {

    @Id
    @Column(name = "sample_id")
    private Integer sampleId;

    @Column(name = "batch_id")
    private Integer batchId;

    @Column(name = "label")
    private Integer label;

    @Column(name = "pc1")
    private Double pc1;

    @Column(name = "pc2")
    private Double pc2;

    protected PcaPoint() {
    }

    public Integer getSampleId() {
        return sampleId;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public Integer getLabel() {
        return label;
    }

    public Double getPc1() {
        return pc1;
    }

    public Double getPc2() {
        return pc2;
    }
}
