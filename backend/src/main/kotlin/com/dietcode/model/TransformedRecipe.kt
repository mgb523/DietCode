package com.dietcode.model

data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,          // = targetServings after backend scaling; = LLM-inferred if no scaling
    val originalServings: Int = 0,  // populated by RecipeController, not LLM; 0 = sentinel "not set"
    val warnings: List<String>
)
