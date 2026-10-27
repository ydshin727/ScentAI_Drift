package com.scentai.gasdrift.controller;

import com.scentai.gasdrift.dto.Dtos.HistoryDto;
import com.scentai.gasdrift.dto.Dtos.JudgementRequest;
import com.scentai.gasdrift.dto.Dtos.JudgementResponse;
import com.scentai.gasdrift.dto.Dtos.PageDto;
import com.scentai.gasdrift.service.JudgementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/judgements")
public class JudgementController {

    private final JudgementService judgementService;

    public JudgementController(JudgementService judgementService) {
        this.judgementService = judgementService;
    }

    /** Judge one sample with v1 and v2 under the given reference gas and threshold. */
    @PostMapping
    public JudgementResponse judge(@RequestBody JudgementRequest request) {
        return judgementService.judge(request);
    }

    /** Judgement history, newest first. */
    @GetMapping
    public PageDto<HistoryDto> history(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return judgementService.history(page, size);
    }
}
