package com.dietcode.service

import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service

@Service
class TransformationService(
    chatClientBuilder: ChatClient.Builder,
    private val objectMapper: ObjectMapper
) {
    private val chatClient = chatClientBuilder.build()

    fun transform(
        recipe: RecipeDocument,
        dietProfiles: List<DietProfile>,
        intolerances: List<String>
    ): TransformedRecipe {
        val dietRules = if (dietProfiles.isEmpty()) "none"
            else dietProfiles.joinToString(", ") { it.name.lowercase().replace("_", "-") }
        val exclusionList = if (intolerances.isEmpty()) "none" else intolerances.joinToString(", ")

        val systemPrompt = """
            You are a professional recipe adaptation expert.
            Rewrite recipes to conform to the specified dietary requirements.

            CRITICAL — hidden non-compliant ingredients:
            Many processed or packaged ingredients contain hidden animal products, gluten, or other
            restricted items. You MUST scrutinize every ingredient, not just obvious ones. Examples:
            - Imitation crab (surimi) contains fish and egg — not vegan, not vegetarian
            - Worcestershire sauce contains anchovies — not vegan, not vegetarian
            - Many breads and sauces contain dairy or eggs — not vegan
            - Soy sauce contains wheat — not gluten-free
            - Some margarines contain dairy — not vegan
            - Gelatin is derived from animal bones — not vegan, not vegetarian
            When in doubt about an ingredient's compliance, replace it AND add a warning explaining why.

            SUBSTITUTION OVER ELIMINATION — always prefer a good substitute over removing an ingredient:
            - Never simply delete a meat or animal product; find the best contextual replacement.
            - Match the role the ingredient plays: smoky/crispy (bacon) → smoked tempeh, coconut bacon,
              or turkey bacon (if not vegetarian); hearty/umami (beef, lamb) → lentils, mushrooms,
              jackfruit, or plant-based ground; delicate protein (chicken breast) → chickpeas, tofu,
              or hearts of palm; seafood → hearts of palm, banana blossom, or tofu.
            - When a constraint cannot be satisfied with a substitute, include a warning explaining why
              and what was done instead.

            For ingredient exclusions, interpret each item broadly and forgive spelling errors
            (e.g. "peenut" means peanuts, "cow milk" means dairy).

            Use the warnings[] array to flag: any substitution that changes the dish significantly,
            any ingredient you were uncertain about, and any constraint you could not fully satisfy.

            SCHEMA RULES for each ingredient line:
            - quantity: numeric amount only — use fractions, not decimals (e.g. "3/4", "1 1/2", "2", never "0.25" or "1.5")
            - unit: measurement unit only — ONLY real units of measure (cup, tsp, tbsp, oz, g, ml, strips, slices, cloves).
              Leave unit EMPTY ("") for countable items that are named by the food itself (tortillas, eggs, sheets, pieces).
              Never use the food's own name as the unit.
            - ingredient: the ingredient name only — do NOT repeat any word already in unit
              (e.g. if unit="strips" write ingredient="coconut bacon, chopped" NOT "coconut bacon strips, chopped")
              (e.g. if unit="" write ingredient="corn or flour tortillas", NOT unit="tortillas" ingredient="corn or flour tortillas")
            - preparation: optional method (e.g. "chopped", "minced") — may be omitted if already in ingredient
            - substitutionNote: if this ingredient was substituted or significantly changed from the
              original, provide a brief explanation (1-2 sentences) of why the substitution was made.
              Set to null (omit the field entirely) if the ingredient was NOT changed from the original.
              Do NOT set substitutionNote to an empty string — use null for unchanged ingredients.

            'servings' in your JSON output must always be a positive integer (minimum 1).
            If the recipe doesn't specify a yield, infer from context or default to 1.

            'instructions' must always be a JSON array of strings — one string per step.
            Never return instructions as a single concatenated string.

            Return ONLY valid JSON matching the required schema — no markdown fences, no prose, no explanation.
        """.trimIndent()

        val userPrompt = """
            Adapt the following recipe.
            Diet profiles: $dietRules
            Ingredients to omit or replace: $exclusionList

            Recipe:
            Name: ${recipe.name ?: "Untitled"}
            Servings: ${recipe.servings ?: "(not specified — infer or use 1)"}
            Ingredients:
            ${recipe.rawIngredients.joinToString("\n")}
            Instructions:
            ${recipe.instructions}
        """.trimIndent()

        val raw = chatClient
            .prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .content()
            ?: throw IllegalStateException("LLM returned null response")

        // Strip markdown code fences — LLM occasionally wraps JSON in ```json ... ``` despite
        // the prompt instruction. Jackson fails on the leading backtick without this guard.
        val json = raw.trim().let { s ->
            if (s.startsWith("```")) s.removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
            else s
        }

        return objectMapper.readValue(json, TransformedRecipe::class.java)
    }
}
