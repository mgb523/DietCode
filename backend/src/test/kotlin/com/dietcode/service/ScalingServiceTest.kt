package com.dietcode.service

import com.dietcode.model.IngredientLine
import com.dietcode.model.TransformedRecipe
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class ScalingServiceTest {
    private val service = ScalingService()

    private fun recipe(vararg ingredients: IngredientLine, servings: Int = 2) = TransformedRecipe(
        recipeName = "Test",
        ingredients = ingredients.toList(),
        instructions = emptyList(),
        servings = servings,
        originalServings = servings,
        warnings = emptyList()
    )

    private fun ing(quantity: String, ingredient: String) = IngredientLine(
        quantity = quantity, unit = "cup", ingredient = ingredient,
        preparation = null, substitutionNote = null
    )

    @Test
    fun `scale returns recipe unchanged when targetServings equals originalServings`() {
        val r = recipe(ing("1", "flour"))
        assertSame(r, service.scale(r, 2))
    }

    @Test
    fun `scale returns recipe unchanged when targetServings is zero`() {
        val r = recipe(ing("1", "flour"))
        assertSame(r, service.scale(r, 0))
    }

    @Test
    fun `scale doubles linear ingredient from 2 to 4 servings`() {
        val r = recipe(ing("1", "flour"))
        val scaled = service.scale(r, 4)
        assertEquals("2", scaled.ingredients[0].quantity)
    }

    @Test
    fun `scale applies sub-linear factor to salt at 2x`() {
        val r = recipe(ing("1", "salt"))
        val scaled = service.scale(r, 4)
        val qty = service.parseQuantity(scaled.ingredients[0].quantity ?: "")!!
        assertTrue(qty > 1.0 && qty < 2.0, "Sub-linear salt should be between 1 and 2, got $qty")
    }

    @Test
    fun `scale applies sub-linear factor to baking powder`() {
        val r = recipe(ing("2", "baking powder"))
        val scaled = service.scale(r, 4)
        val qty = service.parseQuantity(scaled.ingredients[0].quantity ?: "")!!
        assertTrue(qty > 2.0 && qty < 4.0, "Sub-linear baking powder should be between 2 and 4, got $qty")
    }

    @Test
    fun `scale skips ingredient with empty quantity`() {
        val r = recipe(ing("", "vanilla extract"))
        val scaled = service.scale(r, 4)
        assertEquals("", scaled.ingredients[0].quantity)
    }

    @Test
    fun `parseQuantity parses plain decimal`() {
        assertEquals(1.5, service.parseQuantity("1.5"))
    }

    @Test
    fun `parseQuantity parses simple fraction`() {
        assertEquals(0.75, service.parseQuantity("3/4")!!, 0.001)
    }

    @Test
    fun `parseQuantity parses mixed number`() {
        assertEquals(1.5, service.parseQuantity("1 1/2")!!, 0.001)
    }

    @Test
    fun `parseQuantity returns null for blank string`() {
        assertNull(service.parseQuantity(""))
        assertNull(service.parseQuantity("  "))
    }

    @Test
    fun `scale sets servings to targetServings on result`() {
        val r = recipe(ing("1", "flour"))
        val scaled = service.scale(r, 6)
        assertEquals(6, scaled.servings)
    }

    // ── Spice / ¼-increment rounding ──────────────────────────────────────────

    @Test
    fun `formatQuantity with spiceRounding snaps 2_3 to nearest quarter`() {
        // 2/3 ≈ 0.667 → nearest quarter = 3/4
        assertEquals("3/4", service.formatQuantity(2.0 / 3.0, spiceRounding = true))
    }

    @Test
    fun `formatQuantity with spiceRounding returns half for 0_5`() {
        assertEquals("1/2", service.formatQuantity(0.5, spiceRounding = true))
    }

    @Test
    fun `formatQuantity with spiceRounding returns whole for integer`() {
        assertEquals("2", service.formatQuantity(2.0, spiceRounding = true))
    }

    @Test
    fun `formatQuantity with spiceRounding returns mixed number`() {
        // 1.333 → nearest quarter = 1 1/4
        assertEquals("1 1/4", service.formatQuantity(4.0 / 3.0, spiceRounding = true))
    }

    @Test
    fun `isSpiceMeasure true for tsp unit`() {
        assertTrue(service.isSpiceMeasure("tsp", "paprika"))
    }

    @Test
    fun `isSpiceMeasure true for tablespoon unit`() {
        assertTrue(service.isSpiceMeasure("tablespoon", "olive oil"))
    }

    @Test
    fun `isSpiceMeasure true for sublinear ingredient regardless of unit`() {
        assertTrue(service.isSpiceMeasure("cup", "cinnamon"))
    }

    @Test
    fun `isSpiceMeasure false for cup unit with non-spice ingredient`() {
        assertFalse(service.isSpiceMeasure("cup", "flour"))
    }

    @Test
    fun `scale rounds tsp ingredient to quarter increment`() {
        // 1 tsp ingredient scaled from 2 → 3 servings gives factor 1.5 → 1.5 tsp → "1 1/2"
        val r = recipe(
            IngredientLine("1", "tsp", "paprika", null, null),
            servings = 2
        )
        val scaled = service.scale(r, 3)
        assertEquals("1 1/2", scaled.ingredients[0].quantity)
    }

    // ── Whole-unit rounding (garlic) ───────────────────────────────────────────

    @Test
    fun `isWholeUnit true for garlic`() {
        assertTrue(service.isWholeUnit("garlic cloves"))
        assertTrue(service.isWholeUnit("minced garlic"))
        assertTrue(service.isWholeUnit("Garlic"))
    }

    @Test
    fun `isWholeUnit false for non-garlic ingredients`() {
        assertFalse(service.isWholeUnit("onion"))
        assertFalse(service.isWholeUnit("flour"))
    }

    @Test
    fun `scale ceils garlic to nearest whole clove`() {
        // 3 cloves scaled from 4 → 3 servings: 3 * 0.75 = 2.25 → ceil = 3
        val r = recipe(
            IngredientLine("3", "", "garlic cloves", null, null),
            servings = 4
        )
        val scaled = service.scale(r, 3)
        assertEquals("3", scaled.ingredients[0].quantity)
    }

    @Test
    fun `scale ceils garlic when result is fractional`() {
        // 1 clove scaled from 2 → 3 servings: 1 * 1.5 = 1.5 → ceil = 2
        val r = recipe(
            IngredientLine("1", "", "garlic", null, null),
            servings = 2
        )
        val scaled = service.scale(r, 3)
        assertEquals("2", scaled.ingredients[0].quantity)
    }

    @Test
    fun `scale never produces zero garlic — minimum 1`() {
        // 1 clove scaled from 8 → 1 serving: 0.125 → ceil = 1
        val r = recipe(
            IngredientLine("1", "", "garlic cloves", null, null),
            servings = 8
        )
        val scaled = service.scale(r, 1)
        assertEquals("1", scaled.ingredients[0].quantity)
    }

    @Test
    fun `scale rounds tsp ingredient and never produces 2_3`() {
        // 1 tsp scaled from 3 → 2 servings: factor=2/3, result=2/3 tsp → rounded to 3/4
        val r = recipe(
            IngredientLine("1", "tsp", "oregano", null, null),
            servings = 3
        )
        val scaled = service.scale(r, 2)
        val qty = scaled.ingredients[0].quantity!!
        // Must be a quarter-multiple, not 2/3
        assertNotEquals("2/3", qty)
        val value = service.parseQuantity(qty)!!
        // 2/3 ≈ 0.667 → nearest quarter = 0.75; verify it's a multiple of 0.25
        assertEquals(0.0, value.rem(0.25), 0.001)
    }
}
