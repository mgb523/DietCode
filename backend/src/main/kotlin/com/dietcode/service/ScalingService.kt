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

    // Units that only come in ¼-increment measuring tools (spoons).
    // Any ingredient measured in these units rounds to the nearest ¼.
    private val SPICE_UNITS = setOf(
        "tsp", "teaspoon", "teaspoons",
        "tbsp", "tablespoon", "tablespoons"
    )

    // Ingredients that must always be a whole number after scaling.
    // Garlic is the canonical case: there is no such thing as half a clove in a recipe.
    private val WHOLE_UNIT_KEYWORDS = setOf("garlic")

    fun scale(recipe: TransformedRecipe, targetServings: Int): TransformedRecipe {
        val originalServings = recipe.servings
        if (originalServings <= 0 || targetServings <= 0 || targetServings == originalServings) return recipe

        val factor = targetServings.toDouble() / originalServings

        val scaledIngredients = recipe.ingredients.map { line ->
            val qty = parseQuantity(line.quantity ?: "") ?: return@map line
            val scaleFactor = if (isSubLinear(line.ingredient ?: "")) factor.pow(0.5) else factor
            val scaled = qty * scaleFactor
            val formatted = when {
                isWholeUnit(line.ingredient ?: "") ->
                    // Ceiling to nearest whole unit — never suggest a partial garlic clove
                    Math.ceil(scaled).toLong().coerceAtLeast(1L).toString()
                else ->
                    formatQuantity(scaled, spiceRounding = isSpiceMeasure(line.unit ?: "", line.ingredient ?: ""))
            }
            line.copy(quantity = formatted)
        }

        return recipe.copy(
            ingredients = scaledIngredients,
            servings = targetServings
        )
    }

    internal fun isSubLinear(ingredientName: String): Boolean =
        SUBLINEAR_KEYWORDS.any { ingredientName.lowercase().contains(it) }

    /**
     * Returns true when the ingredient quantity must be a whole number after scaling.
     * Garlic cloves cannot be split — always ceil to the nearest integer.
     */
    internal fun isWholeUnit(ingredientName: String): Boolean =
        WHOLE_UNIT_KEYWORDS.any { ingredientName.lowercase().contains(it) }

    /**
     * Returns true when the ingredient should round to the nearest ¼ after scaling.
     * Triggered by small-volume units (tsp/tbsp) OR by the ingredient being a recognised
     * spice/leavening — both cases where only ¼-increment measuring tools exist.
     */
    internal fun isSpiceMeasure(unit: String, ingredient: String): Boolean =
        unit.trim().lowercase() in SPICE_UNITS || isSubLinear(ingredient)

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

    /**
     * Format a scaled quantity as a human-readable fraction string.
     *
     * [spiceRounding] = true  → round to nearest ¼  (only ¼, ½, ¾ fractional parts)
     *                           Used for spices and anything measured in tsp/tbsp, where
     *                           no measuring tool smaller than ¼ exists.
     * [spiceRounding] = false → round to nearest ⅛  (full set of common cup fractions)
     *                           Used for bulk ingredients like flour, liquids, etc.
     */
    internal fun formatQuantity(value: Double, spiceRounding: Boolean = false): String {
        if (spiceRounding) {
            // Snap to nearest ¼ increment
            val quarters = (value * 4.0).roundToLong()
            val whole = quarters / 4
            val remainder = quarters % 4   // 0, 1, 2, or 3
            if (remainder == 0L) return whole.toString()
            val (num, den) = when (remainder) {
                1L -> 1L to 4L
                2L -> 1L to 2L   // simplify 2/4 → 1/2
                3L -> 3L to 4L
                else -> remainder to 4L
            }
            return if (whole == 0L) "$num/$den" else "$whole $num/$den"
        }

        // Round to nearest ⅛ for bulk/liquid ingredients
        val eighths = (value * 8.0).roundToLong()
        val whole = eighths / 8
        val remainder = eighths % 8
        if (remainder == 0L) return whole.toString()
        val g = gcd(remainder, 8L)
        val num = remainder / g
        val den = 8L / g
        return if (whole == 0L) "$num/$den" else "$whole $num/$den"
    }

    private fun gcd(a: Long, b: Long): Long = if (b == 0L) a else gcd(b, a % b)
}
