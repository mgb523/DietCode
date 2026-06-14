package com.dietcode.service

import com.dietcode.exception.ScrapingException
import com.dietcode.model.RecipeDocument
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.jsoup.Jsoup
import org.springframework.stereotype.Service

@Service
class RecipeIngestionService {

    fun ingest(input: String): RecipeDocument {
        return if (input.startsWith("http://") || input.startsWith("https://")) {
            scrapeUrl(input)
        } else {
            // Phase 2: text-only path — no LLM calls (CLAUDE.md constraint).
            // Pass raw text through; TransformationService + ChatClient handle semantic parsing.
            // Split on lines for rawIngredients; pass full text as instructions fallback.
            val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
            RecipeDocument(
                name = null,            // LLM infers the recipe name
                rawIngredients = lines, // All non-blank lines; LLM identifies which are ingredients
                instructions = input,   // Full raw text passed as fallback to LLM
                servings = null
            )
        }
    }

    private fun scrapeUrl(url: String): RecipeDocument {
        val doc = try {
            Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (compatible; DietCode/1.0)")
                .timeout(10_000)
                .get()
        } catch (e: Exception) {
            throw ScrapingException("Failed to fetch URL: ${e.message}")
        }

        // JSON-LD path (first priority — CLAUDE.md scraping priority order)
        // Use select() plural — pages may have multiple script blocks (breadcrumbs, org, recipe)
        val scripts = doc.select("script[type=application/ld+json]")
        for (script in scripts) {
            val jsonText = script.data()  // .data() NOT .text() — DataNode content
            try {
                return parseJsonLd(jsonText)
            } catch (_: ScrapingException) {
                continue  // try next script block
            }
        }

        // Microdata fallback
        val microdataIngredients = doc.select("[itemprop=recipeIngredient]").map { it.text() }
        if (microdataIngredients.isNotEmpty()) {
            return RecipeDocument(
                name = doc.selectFirst("[itemprop=name]")?.text(),
                rawIngredients = microdataIngredients,
                instructions = doc.select("[itemprop=recipeInstructions]").map { it.text() }.joinToString("\n"),
                servings = doc.selectFirst("[itemprop=recipeYield]")?.text()
                    ?.filter { it.isDigit() }?.takeIf { it.isNotEmpty() }?.toIntOrNull()
            )
        }

        // Heuristic HTML fallback
        val listItems = doc.select("ul li, ol li").map { it.text() }.filter { it.isNotBlank() }
        if (listItems.isNotEmpty()) {
            return RecipeDocument(
                name = doc.title().takeIf { it.isNotBlank() },
                rawIngredients = listItems,
                instructions = doc.body().text(),
                servings = null
            )
        }

        // Fail loudly — never pass empty content to LLM (CLAUDE.md constraint)
        throw ScrapingException("No recipe content found at URL")
    }

    private fun parseJsonLd(jsonText: String): RecipeDocument {
        val mapper = jacksonObjectMapper()
        val raw = try {
            mapper.readValue<Map<String, Any>>(jsonText)
        } catch (e: Exception) {
            throw ScrapingException("Invalid JSON in script block: ${e.message}")
        }

        // Handle both inline {"@type":"Recipe"} and @graph array format (Yoast SEO pattern)
        val recipeNode: Map<*, *> = when {
            raw["@type"] == "Recipe" -> raw
            raw["@graph"] is List<*> -> {
                @Suppress("UNCHECKED_CAST")
                (raw["@graph"] as List<Map<*, *>>).firstOrNull { it["@type"] == "Recipe" }
                    ?: throw ScrapingException("No Recipe node in @graph")
            }
            else -> throw ScrapingException("JSON-LD is not a Recipe schema")
        }

        @Suppress("UNCHECKED_CAST")
        val ingredients = (recipeNode["recipeIngredient"] as? List<String>) ?: emptyList()
        if (ingredients.isEmpty()) {
            throw ScrapingException("JSON-LD Recipe has no recipeIngredient entries")
        }

        val instructions = extractInstructions(recipeNode["recipeInstructions"])
        val servings = parseYield(recipeNode["recipeYield"])

        return RecipeDocument(
            name = recipeNode["name"] as? String,
            rawIngredients = ingredients,
            instructions = instructions.joinToString("\n"),
            servings = servings
        )
    }

    private fun parseYield(raw: Any?): Int? = when (raw) {
        is Int -> raw
        is String -> raw.filter { it.isDigit() }.takeIf { it.isNotEmpty() }?.toIntOrNull()
        is List<*> -> raw.firstOrNull()?.let { parseYield(it) }
        else -> null
    }

    private fun extractInstructions(raw: Any?): List<String> = when (raw) {
        is String -> listOf(raw)
        is List<*> -> raw.mapNotNull { step ->
            when (step) {
                is String -> step
                is Map<*, *> -> step["text"] as? String  // HowToStep schema
                else -> null
            }
        }
        else -> emptyList()
    }
}
