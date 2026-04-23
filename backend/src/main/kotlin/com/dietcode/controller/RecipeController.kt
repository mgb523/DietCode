package com.dietcode.controller

import com.dietcode.model.TransformRequest
import com.dietcode.model.TransformedRecipe
import com.dietcode.service.RecipeIngestionService
import com.dietcode.service.TransformationService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/recipe")
class RecipeController(
    private val ingestionService: RecipeIngestionService,
    private val transformationService: TransformationService
) {
    @PostMapping("/transform")
    fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
        require(request.input.isNotBlank()) { "Recipe input must not be blank" }
        require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }
        val recipeDoc = ingestionService.ingest(request.input)
        return transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
    }
}
