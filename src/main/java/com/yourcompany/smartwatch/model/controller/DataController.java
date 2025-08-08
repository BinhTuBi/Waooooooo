package com.yourcompany.smartwatch.model.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api")
public class DataController {
    // ... (Dán toàn bộ nội dung file DataController.java đã cung cấp ở câu trả lời trước) ...
    private final Random random = new Random();
    private final AtomicInteger currentSteps = new AtomicInteger(0);

    private final DashboardData.WeatherData[] weatherStates = new DashboardData.WeatherData[]{
            new DashboardData.WeatherData("Trời Nắng", "fa-sun", 28, 30, 70),
            new DashboardData.WeatherData("Nhiều Mây", "fa-cloud", 24, 25, 80),
            new DashboardData.WeatherData("Mưa Rào", "fa-cloud-showers-heavy", 22, 23, 90),
            new DashboardData.WeatherData("Có Mây", "fa-cloud-sun", 26, 28, 75)
    };

    @GetMapping("/dashboard-data")
    public DashboardData getDashboardData() {
        DashboardData data = new DashboardData();

        data.setHeartRate(random.nextInt(31) + 65);
        currentSteps.addAndGet(random.nextInt(5));
        data.setSteps(currentSteps.get());
        data.setDistance(Double.parseDouble(String.format("%.2f", data.getSteps() * 0.0007)));
        data.setCalories((int) (data.getSteps() * 0.04));
        data.setWeather(weatherStates[random.nextInt(weatherStates.length)]);

        return data;
    }
}