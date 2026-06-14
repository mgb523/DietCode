package com.dietcode.controller

import com.dietcode.model.IngredientLine
import com.dietcode.model.TransformRequest
import com.dietcode.model.TransformedRecipe
import com.dietcode.service.RecipeIngestionService
import com.dietcode.service.ScalingService
import com.dietcode.service.TransformationService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/recipe")
class RecipeController(
    private val ingestionService: RecipeIngestionService,
    private val transformationService: TransformationService,
    private val scalingService: ScalingService
) {
    @PostMapping("/transform")
    fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
        require(request.input.isNotBlank()) { "Recipe input must not be blank" }
        require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }

        val recipeDoc = ingestionService.ingest(request.input)
        val transformed = transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)

        // Capture LLM-inferred serving count BEFORE ScalingService may overwrite recipe.servings
        val llmServings = transformed.servings

        // Attach original recipe data from recipeDoc (per D-01, D-02)
        val withOriginals = transformed.copy(
            originalIngredients = recipeDoc.rawIngredients.map { raw ->
                IngredientLine(quantity = "", unit = "", ingredient = raw, preparation = null, substitutionNote = null)
            },
            originalInstructions = recipeDoc.instructions.lines().filter { it.isNotBlank() }
        )

        return request.targetServings
            ?.takeIf { it > 0 && it != withOriginals.servings }
            ?.let { scalingService.scale(withOriginals.copy(originalServings = llmServings), it) }
            ?: withOriginals.copy(originalServings = llmServings)
    }
}
