package com.dietcode.model

data class TransformRequest(
    val input: String,
    val dietProfiles: List<DietProfile>,
    val intolerances: List<String>,
    val targetServings: Int? = null   // null = use LLM-inferred serving count as-is
)
