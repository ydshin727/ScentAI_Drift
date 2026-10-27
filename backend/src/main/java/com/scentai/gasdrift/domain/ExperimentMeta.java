package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Experiment settings (meta.json) stored as one JSON row with id = 1. */
@Entity
@Table(name = "experiment_meta")
public class ExperimentMeta {

    @Id
    private Integer id;

    @Column(name = "meta_json", columnDefinition = "json")
    private String metaJson;

    protected ExperimentMeta() {
    }

    public Integer getId() {
        return id;
    }

    public String getMetaJson() {
        return metaJson;
    }
}
