package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.PcaPoint;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PcaPointRepository extends JpaRepository<PcaPoint, Integer> {

    List<PcaPoint> findByBatchIdOrderBySampleId(Integer batchId);
}
