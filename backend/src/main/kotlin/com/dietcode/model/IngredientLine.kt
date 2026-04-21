package com.dietcode.model

import com.fasterxml.jackson.annotation.JsonProperty

data class IngredientLine(
    val quantity: String,
    val unit: String,
    val ingredient: String,
    val preparation: String?,
    @get:JsonProperty("substitutionNote")
    val substitutionNote: String?
)
