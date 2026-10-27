package com.scentai.gasdrift.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "gas")
public class Gas {

    @Id
    @Column(name = "label")
    private Integer label;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "name_ko")
    private String nameKo;

    protected Gas() {
    }

    public Integer getLabel() {
        return label;
    }

    public String getNameEn() {
        return nameEn;
    }

    public String getNameKo() {
        return nameKo;
    }
}
