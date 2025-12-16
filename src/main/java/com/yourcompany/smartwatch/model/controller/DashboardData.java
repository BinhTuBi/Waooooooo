package com.yourcompany.smartwatch.model.controller;


public class DashboardData {
    // ... (Dán toàn bộ nội dung file DashboardData.java đã cung cấp ở câu trả lời trước) ...
    private int heartRate;
    private int steps;
    private double distance;
    private int calories;
    private WeatherData weather;

    // Getters and Setters
    public int getHeartRate() { return heartRate; }
    public void setHeartRate(int heartRate) { this.heartRate = heartRate; }
    public int getSteps() { return steps; }
    public void setSteps(int steps) { this.steps = steps; }
    public double getDistance() { return distance; }
    public void setDistance(double distance) { this.distance = distance; }
    public int getCalories() { return calories; }
    public void setCalories(int calories) { this.calories = calories; }
    public WeatherData getWeather() { return weather; }
    public void setWeather(WeatherData weather) { this.weather = weather; }

    public static class WeatherData {
        private String description;
        private String icon;
        private int temperature;
        private int feelsLike;
        private int humidity;

        public WeatherData(String description, String icon, int temperature, int feelsLike, int humidity) {
            this.description = description;
            this.icon = icon;
            this.temperature = temperature;
            this.feelsLike = feelsLike;
            this.humidity = humidity;
        }

        // Getters and Setters
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }
        public int getTemperature() { return temperature; }
        public void setTemperature(int temperature) { this.temperature = temperature; }
        public int getFeelsLike() { return feelsLike; }
        public void setFeelsLike(int feelsLike) { this.feelsLike = feelsLike; }
        public int getHumidity() { return humidity; }
        public void setHumidity(int humidity) { this.humidity = humidity; }
    }
}
