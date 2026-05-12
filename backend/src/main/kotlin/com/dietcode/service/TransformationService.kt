package com.dietcode.service

import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service

@Service
class TransformationService(chatClientBuilder: ChatClient.Builder) {
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

            For ingredient exclusions, interpret each item broadly and forgive spelling errors
            (e.g. "peenut" means peanuts, "cow milk" means dairy).

            Use the warnings[] array to flag: any substitution that changes the dish significantly,
            any ingredient you were uncertain about, and any constraint you could not fully satisfy.

            Return ONLY valid JSON matching the required schema — no markdown fences, no prose, no explanation.
        """.trimIndent()

        val userPrompt = """
            Adapt the following recipe.
            Diet profiles: $dietRules
            Ingredients to omit or replace: $exclusionList

            Recipe:
            Name: ${recipe.name ?: "Untitled"}
            Servings: ${recipe.servings ?: "unknown"}
            Ingredients:
            ${recipe.rawIngredients.joinToString("\n")}
            Instructions:
            ${recipe.instructions}
        """.trimIndent()

        return chatClient
            .prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .entity(TransformedRecipe::class.java)
            ?: throw IllegalStateException("LLM returned null — possible malformed response")
    }
}
