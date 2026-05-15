package com.dietcode.service

import com.dietcode.model.TransformedRecipe
import org.springframework.stereotype.Service
import kotlin.math.pow
import kotlin.math.roundToLong

@Service
class ScalingService {

    private val SUBLINEAR_KEYWORDS = setOf(
        // Leavening
        "baking powder", "baking soda", "bicarbonate", "yeast",
        // Salt
        "salt",
        // Strong spices
        "cayenne", "chili powder", "red pepper flakes", "black pepper",
        "cinnamon", "nutmeg", "cloves", "allspice",
        "ginger", "cardamom", "turmeric", "cumin"
    )

    fun scale(recipe: TransformedRecipe, targetServings: Int): TransformedRecipe {
        val originalServings = recipe.servings
        if (originalServings <= 0 || targetServings <= 0 || targetServings == originalServings) return recipe

        val factor = targetServings.toDouble() / originalServings

        val scaledIngredients = recipe.ingredients.map { line ->
            val qty = parseQuantity(line.quantity) ?: return@map line
            val scaleFactor = if (isSubLinear(line.ingredient)) factor.pow(0.5) else factor
            line.copy(quantity = formatQuantity(qty * scaleFactor))
        }

        return recipe.copy(
            ingredients = scaledIngredients,
            servings = targetServings
        )
    }

    internal fun isSubLinear(ingredientName: String): Boolean =
        SUBLINEAR_KEYWORDS.any { ingredientName.lowercase().contains(it) }

    internal fun parseQuantity(s: String): Double? {
        val trimmed = s.trim()
        if (trimmed.isBlank()) return null

        // Plain decimal
        trimmed.toDoubleOrNull()?.let { return it }

        // Simple fraction "A/B"
        val fracRegex = Regex("""^(\d+)\s*/\s*(\d+)$""")
        fracRegex.matchEntire(trimmed)?.let { m ->
            val (num, den) = m.destructured
            return num.toDouble() / den.toDouble()
        }

        // Mixed number "W A/B"
        val mixedRegex = Regex("""^(\d+)\s+(\d+)\s*/\s*(\d+)$""")
        mixedRegex.matchEntire(trimmed)?.let { m ->
            val (whole, num, den) = m.destructured
            return whole.toDouble() + num.toDouble() / den.toDouble()
        }

        return null
    }

    internal fun formatQuantity(value: Double): String {
        // Round to nearest 1/8 to avoid floating-point noise
        val rounded = (value * 8.0).roundToLong() / 8.0
        return if (rounded == rounded.toLong().toDouble()) {
            rounded.toLong().toString()
        } else {
            "%.2f".format(rounded).trimEnd('0').trimEnd('.')
        }
    }
}
