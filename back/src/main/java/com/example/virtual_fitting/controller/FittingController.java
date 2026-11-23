package com.example.virtual_fitting.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/fitting")
@CrossOrigin(origins = "http://localhost:3000")
public class FittingController {

    private static final String PYTHON_PATH =
            "C:\\dev\\virtual-fitting\\FASHIONNET\\.venv\\Scripts\\python.exe";

    private static final String PROJECT_PATH =
            "C:\\dev\\virtual-fitting\\FASHIONNET";

    @PostMapping("/start")
    public ResponseEntity<String> startFitting() {
        try {
            long pid = startPython(null, null, null, null);
            return ResponseEntity.ok("가상피팅 웹캠을 시작했습니다. PID=" + pid);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("실행 실패: " + e.getMessage());
        }
    }

    @PostMapping("/recommend")
    public ResponseEntity<String> startRecommendedFitting(
            @RequestBody RecommendedOutfitRequest request) {
        try {
            if (request == null
                    || isBlank(request.topImagePath())
                    || isBlank(request.bottomImagePath())) {
                return ResponseEntity.badRequest()
                        .body("추천 상의와 하의 이미지 경로가 모두 필요합니다.");
            }

            long pid = startPython(
                    request.topImagePath(),
                    request.bottomImagePath(),
                    request.topName(),
                    request.bottomName()
            );

            return ResponseEntity.ok(
                    "추천 코디를 선택한 상태로 웹캠을 시작했습니다. PID=" + pid
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("추천 코디 가상피팅 실행 실패: " + e.getMessage());
        }
    }

    public record RecommendedOutfitRequest(
            String topImagePath,
            String bottomImagePath,
            String topName,
            String bottomName
    ) {}

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private long startPython(
            String topImagePath,
            String bottomImagePath,
            String topName,
            String bottomName
    ) throws Exception {

        File projectDir = new File(PROJECT_PATH);
        File pythonFile = new File(PYTHON_PATH);
        File mainFile = new File(projectDir, "main.py");

        if (!pythonFile.isFile()) {
            throw new IllegalStateException("Python 실행 파일이 없습니다: " + PYTHON_PATH);
        }
        if (!mainFile.isFile()) {
            throw new IllegalStateException("main.py 파일이 없습니다: " + mainFile.getAbsolutePath());
        }

        List<String> command = new ArrayList<>();
        command.add(PYTHON_PATH);
        command.add("-u");
        command.add("main.py");

        if (!isBlank(topImagePath)) {
            command.add("--top");
            command.add(topImagePath);
        }
        if (!isBlank(bottomImagePath)) {
            command.add("--bottom");
            command.add(bottomImagePath);
        }
        if (!isBlank(topName)) {
            command.add("--top-name");
            command.add(topName);
        }
        if (!isBlank(bottomName)) {
            command.add("--bottom-name");
            command.add(bottomName);
        }

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(projectDir);
        pb.redirectErrorStream(true);
        pb.environment().put("PYTHONUNBUFFERED", "1");
        pb.environment().put("PYTHONIOENCODING", "utf-8");
        pb.environment().put("PYTHONUTF8", "1");

        File logFile = new File(projectDir, "fitting_process.log");
        pb.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));

        Process process = pb.start();
        System.out.println("[Fitonx] Python 실행 요청 완료. PID: " + process.pid());
        System.out.println("[Fitonx] Python 로그 파일: " + logFile.getAbsolutePath());
        return process.pid();
    }
}
