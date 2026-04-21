package com.dietcode.service

import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
import org.springframework.ai.converter.BeanOutputConverter
import org.springframework.stereotype.Service

@Service
class TransformationService {
    // BeanOutputConverter registered in Phase 1 — enforces IngredientLine + warnings[] schema (TRANS-02)
    // Phase 2 will inject AnthropicChatModel and call converter.getJsonSchema() + converter.convert()
    private val outputConverter = BeanOutputConverter(TransformedRecipe::class.java)

    fun transform(
        recipe: RecipeDocument,
        dietProfiles: List<DietProfile>,
        intolerances: List<String>
    ): TransformedRecipe {
        TODO("Phase 2: Build prompt with outputConverter.getJsonSchema(), call LLM, parse with outputConverter.convert()")
    }
}
