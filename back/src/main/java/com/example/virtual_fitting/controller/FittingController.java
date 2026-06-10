package com.example.virtual_fitting.controller;

import org.springframework.web.bind.annotation.*;
import java.io.File;

@RestController
@RequestMapping("/api/fitting")
@CrossOrigin(origins = "http://localhost:3000")
public class FittingController {

    @PostMapping("/start")
    public String startFitting() {

        try {

            ProcessBuilder pb = new ProcessBuilder(
                    "C:\\dev\\virtual-fitting\\FASHIONNET\\venv\\Scripts\\python.exe",
                    "main.py"
            );

            pb.directory(new File("C:\\dev\\virtual-fitting\\FASHIONNET"));

            pb.redirectErrorStream(true);
            pb.start();

            return "가상 피팅 시작!";

        } catch (Exception e) {
            e.printStackTrace();
            return "실행 실패: " + e.getMessage();
        }
    }
}