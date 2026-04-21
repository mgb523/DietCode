package com.dietcode.model

data class TransformRequest(
    val input: String,
    val dietProfiles: List<DietProfile>,
    val intolerances: List<String>
)
