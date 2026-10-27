package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.JudgementHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JudgementHistoryRepository extends JpaRepository<JudgementHistory, Long> {
}
