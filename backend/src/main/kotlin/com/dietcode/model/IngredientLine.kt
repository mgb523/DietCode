package com.dietcode.model

import com.fasterxml.jackson.annotation.JsonProperty

data class IngredientLine(
    val quantity: String?,      // nullable — LLM returns null for "to taste" / unmeasured ingredients
    val unit: String?,           // nullable — LLM omits for countable items (eggs, tortillas)
    val ingredient: String?,     // nullable — shouldn't be null but LLM may omit; safe default
    val preparation: String?,
    @get:JsonProperty("substitutionNote")
    val substitutionNote: String?
)
