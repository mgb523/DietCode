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
        // Round to nearest 1/8
        val eighths = (value * 8.0).roundToLong()
        val whole = eighths / 8
        val remainder = eighths % 8
        if (remainder == 0L) return whole.toString()
        // Simplify the fractional part (gcd of remainder and 8)
        val g = gcd(remainder, 8L)
        val num = remainder / g
        val den = 8L / g
        return if (whole == 0L) "$num/$den" else "$whole $num/$den"
    }

    private fun gcd(a: Long, b: Long): Long = if (b == 0L) a else gcd(b, a % b)
}
