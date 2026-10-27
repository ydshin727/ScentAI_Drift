package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.ConfusionMatrixRow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfusionMatrixRepository extends JpaRepository<ConfusionMatrixRow, Integer> {

    List<ConfusionMatrixRow> findAllByOrderByBatchIdAscModelNameAsc();
}
