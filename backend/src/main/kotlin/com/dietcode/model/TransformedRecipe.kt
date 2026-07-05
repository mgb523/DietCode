package com.dietcode.model

data class TransformedRecipe(
    val recipeName: String? = null,           // nullable: LLM occasionally omits; controller fills "Untitled"
    val ingredients: List<IngredientLine> = emptyList(),
    val instructions: List<String> = emptyList(),
    val servings: Int = 1,                    // = targetServings after scaling; = LLM-inferred if no scaling
    val originalServings: Int = 0,            // populated by RecipeController, not LLM; 0 = sentinel "not set"
    val warnings: List<String> = emptyList(),
    val originalIngredients: List<IngredientLine>? = null,
    val originalInstructions: List<String>? = null,
)
