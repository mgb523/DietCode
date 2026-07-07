package com.dietcode.model

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.core.JsonToken
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize

/**
 * Safety-net deserializer: handles the case where the LLM returns "unknown", "N/A", or any other
 * non-numeric string for servings (e.g. when the source recipe has no yield information).
 * Falls back to 1 for any un-parseable value rather than throwing.
 */
class FlexibleIntDeserializer : JsonDeserializer<Int>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Int =
        when {
            p.currentToken.isNumeric -> p.intValue.coerceAtLeast(1)
            else -> p.text?.trim()?.toIntOrNull()?.coerceAtLeast(1) ?: 1
        }
}

/**
 * Safety-net deserializer: handles the case where the LLM returns a field that should be
 * List<String> as a bare JSON string instead of a JSON array.  Splits on newlines so that
 * numbered steps ("1- ...\n2- ...") each become a separate element.
 */
class FlexibleStringListDeserializer : JsonDeserializer<List<String>>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): List<String> {
        return when (p.currentToken) {
            JsonToken.START_ARRAY -> buildList {
                while (p.nextToken() != JsonToken.END_ARRAY) add(p.text ?: "")
            }.filter { it.isNotBlank() }

            JsonToken.VALUE_STRING -> {
                val text = p.text ?: return emptyList()
                text.split("\n")
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .ifEmpty { listOf(text) }   // single-line prose: keep as one element
            }

            else -> emptyList()
        }
    }
}

data class TransformedRecipe(
    val recipeName: String? = null,           // nullable: LLM occasionally omits; controller fills "Untitled"
    val ingredients: List<IngredientLine> = emptyList(),
    @JsonDeserialize(using = FlexibleStringListDeserializer::class)
    val instructions: List<String> = emptyList(),
    @JsonDeserialize(using = FlexibleIntDeserializer::class)
    val servings: Int = 1,                    // = targetServings after scaling; = LLM-inferred if no scaling
    val originalServings: Int = 0,            // populated by RecipeController, not LLM; 0 = sentinel "not set"
    val warnings: List<String> = emptyList(),
    @JsonDeserialize(using = FlexibleStringListDeserializer::class)
    val originalInstructions: List<String>? = null,
    val originalIngredients: List<IngredientLine>? = null,
)
