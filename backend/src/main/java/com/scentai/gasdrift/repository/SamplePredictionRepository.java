package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.SamplePrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SamplePredictionRepository extends JpaRepository<SamplePrediction, Integer> {

    @Query("select s from SamplePrediction s "
            + "where (:batch is null or s.batchId = :batch) "
            + "and (:label is null or s.trueLabel = :label)")
    Page<SamplePrediction> search(@Param("batch") Integer batch,
                                  @Param("label") Integer label,
                                  Pageable pageable);
}
