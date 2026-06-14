package com.dietcode.controller

import com.dietcode.exception.ScrapingException
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ValidationExceptionHandler {
    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(e: IllegalArgumentException) = mapOf("error" to e.message)

    @ExceptionHandler(ScrapingException::class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    fun handleScraping(e: ScrapingException) =
        mapOf("error" to "scraping_failed", "message" to e.message.orEmpty())
}
