package com.scentai.gasdrift.repository;

import com.scentai.gasdrift.domain.Gas;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GasRepository extends JpaRepository<Gas, Integer> {
}
