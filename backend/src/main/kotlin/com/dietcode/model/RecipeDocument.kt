package com.dietcode.model

data class RecipeDocument(
    val name: String?,
    val rawIngredients: List<String>,
    val instructions: String,
    val servings: Int?
)
