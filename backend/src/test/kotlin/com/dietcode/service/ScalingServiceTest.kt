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
        val qty = service.parseQuantity(scaled.ingredients[0].quantity)!!
        assertTrue(qty > 1.0 && qty < 2.0, "Sub-linear salt should be between 1 and 2, got $qty")
    }

    @Test
    fun `scale applies sub-linear factor to baking powder`() {
        val r = recipe(ing("2", "baking powder"))
        val scaled = service.scale(r, 4)
        val qty = service.parseQuantity(scaled.ingredients[0].quantity)!!
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
}
