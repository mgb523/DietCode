package com.dietcode.service

import com.dietcode.model.RecipeDocument
import org.springframework.stereotype.Service

@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        // Phase 2: text-only path — no LLM calls (CLAUDE.md constraint).
        // Pass raw text through; TransformationService + ChatClient handle semantic parsing.
        // Split on lines for rawIngredients; pass full text as instructions fallback.
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        return RecipeDocument(
            name = null,            // LLM infers the recipe name
            rawIngredients = lines, // All non-blank lines; LLM identifies which are ingredients
            instructions = input,   // Full raw text passed as fallback to LLM
            servings = null
        )
    }
}
