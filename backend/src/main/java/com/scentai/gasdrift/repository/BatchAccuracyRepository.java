package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.BatchAccuracy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchAccuracyRepository extends JpaRepository<BatchAccuracy, Integer> {

    List<BatchAccuracy> findAllByOrderByBatchIdAscModelNameAsc();
}
