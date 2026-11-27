package com.foodhub.user.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient orderRestClient(@Value("${app.services.order-url:http://localhost:8084}") String orderUrl) {
        return RestClient.builder()
                .baseUrl(orderUrl)
                .build();
    }
}
