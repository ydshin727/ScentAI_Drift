package com.scentai.gasdrift.controller;

import com.scentai.gasdrift.dto.Dtos.AccuracyDto;
import com.scentai.gasdrift.dto.Dtos.ConfusionDto;
import com.scentai.gasdrift.dto.Dtos.MetaDto;
import com.scentai.gasdrift.dto.Dtos.PageDto;
import com.scentai.gasdrift.dto.Dtos.PcaPointDto;
import com.scentai.gasdrift.dto.Dtos.SampleDto;
import com.scentai.gasdrift.service.ResultService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    /** Accuracy per model (v1, v2, v1_cv5 baseline) and batch. */
    @GetMapping("/accuracy")
    public List<AccuracyDto> accuracy() {
        return resultService.accuracy();
    }

    /** All confusion matrices (v1 and v2 for batches 2..10). The client filters by batch. */
    @GetMapping("/confusion")
    public List<ConfusionDto> confusion() {
        return resultService.confusion();
    }

    /** PCA points, e.g. /api/pca?batches=1,10&max=300 */
    @GetMapping("/pca")
    public List<PcaPointDto> pca(@RequestParam(required = false) List<Integer> batches,
                                 @RequestParam(defaultValue = "400") int max) {
        return resultService.pca(batches, max);
    }

    /** Test samples with v1/v2 predictions, e.g. /api/samples?batch=10&label=6&page=0&size=20 */
    @GetMapping("/samples")
    public PageDto<SampleDto> samples(@RequestParam(required = false) Integer batch,
                                      @RequestParam(required = false) Integer label,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return resultService.samples(batch, label, page, size);
    }

    /** Gas names and experiment settings. */
    @GetMapping("/meta")
    public MetaDto meta() {
        return resultService.meta();
    }
}
