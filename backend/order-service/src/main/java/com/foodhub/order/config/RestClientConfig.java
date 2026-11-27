package com.foodhub.order.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient cartRestClient(@Value("${app.services.cart-url:http://localhost:8083}") String cartUrl) {
        return RestClient.builder()
                .baseUrl(cartUrl)
                .build();
    }

    @Bean
    public RestClient menuRestClient(@Value("${app.services.menu-url:http://localhost:8082}") String menuUrl) {
        return RestClient.builder()
                .baseUrl(menuUrl)
                .build();
    }
}
