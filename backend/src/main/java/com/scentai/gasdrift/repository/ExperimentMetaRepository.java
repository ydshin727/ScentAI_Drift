package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.ExperimentMeta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperimentMetaRepository extends JpaRepository<ExperimentMeta, Integer> {
}
