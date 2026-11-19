
package com.example.virtual_fitting.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/fitting")
@CrossOrigin(origins = "http://localhost:3000")
public class FittingController {

    private static final String PYTHON_PATH =
            "C:\\dev\\virtual-fitting\\FASHIONNET\\venv\\Scripts\\python.exe";

    private static final String PROJECT_PATH =
            "C:\\dev\\virtual-fitting\\FASHIONNET";

    // 기존 일반 가상피팅 실행
    @PostMapping("/start")
    public ResponseEntity<String> startFitting() {
        try {
            startPython(null, null);
            return ResponseEntity.ok("가상피팅 시작!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("실행 실패: " + e.getMessage());
        }
    }

    // 날씨 추천 코디 가상피팅 실행
    @PostMapping("/recommend")
    public ResponseEntity<String> startRecommendedFitting(
            @RequestBody RecommendedOutfitRequest request) {

        try {
            String top = request.topImagePath();
            String bottom = request.bottomImagePath();

            if (top == null || bottom == null ||
                    top.isBlank() || bottom.isBlank()) {
                return ResponseEntity.badRequest()
                        .body("상의와 하의 이미지가 필요합니다.");
            }

            startPython(top, bottom);

            return ResponseEntity.ok("추천 코디 가상피팅 시작!");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("실행 실패: " + e.getMessage());
        }
    }

    public record RecommendedOutfitRequest(
            String topImagePath,
            String bottomImagePath
    ) {}

    private void startPython(
            String topImagePath,
            String bottomImagePath
    ) throws Exception {

        ProcessBuilder pb;

        if (topImagePath != null && bottomImagePath != null) {
            pb = new ProcessBuilder(
                    PYTHON_PATH,
                    "main.py",
                    "--top",
                    topImagePath,
                    "--bottom",
                    bottomImagePath
            );
        } else {
            pb = new ProcessBuilder(
                    PYTHON_PATH,
                    "main.py"
            );
        }

        pb.directory(new File(PROJECT_PATH));
        pb.redirectErrorStream(true);

        // Python 실행 로그 파일
        File logFile = new File(
                PROJECT_PATH,
                "fitting_process.log"
        );

        pb.redirectOutput(
                ProcessBuilder.Redirect.appendTo(logFile)
        );

        pb.start();
    }
}
