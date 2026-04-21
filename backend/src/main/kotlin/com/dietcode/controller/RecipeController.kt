package com.dietcode.controller

import com.dietcode.model.IngredientLine
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
        // Phase 1 stub — hardcoded response proves CORS + serialization before LLM is wired
        return TransformedRecipe(
            recipeName = "Vegan Chocolate Chip Cookies (Stub)",
            ingredients = listOf(
                IngredientLine("2", "cups", "oat flour", null, null),
                IngredientLine("1/2", "cup", "coconut oil", "melted", null),
                IngredientLine("3/4", "cup", "maple syrup", null, null),
                IngredientLine("1", "cup", "vegan chocolate chips", null, "Substituted dairy chocolate chips — free of milk solids")
            ),
            instructions = listOf(
                "Preheat oven to 350°F (175°C).",
                "Whisk together oat flour and a pinch of salt in a large bowl.",
                "In a separate bowl, combine melted coconut oil and maple syrup.",
                "Fold wet ingredients into dry until just combined, then stir in chocolate chips.",
                "Drop by rounded tablespoons onto a parchment-lined baking sheet.",
                "Bake 12 minutes until edges are set. Cool on the pan for 5 minutes."
            ),
            servings = 24,
            warnings = listOf("Oat flour replaces all-purpose flour — cookies will be denser and more crumbly than the original.")
        )
    }
}
