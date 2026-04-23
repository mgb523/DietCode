package com.dietcode.service

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class RecipeIngestionServiceTest {
    private val service = RecipeIngestionService()

    @Test
    fun `ingest splits lines into rawIngredients`() {
        val doc = service.ingest("2 cups flour\n1 egg\nMix well")
        assertEquals(listOf("2 cups flour", "1 egg", "Mix well"), doc.rawIngredients)
    }

    @Test
    fun `ingest filters blank lines and trims whitespace`() {
        val doc = service.ingest("  \n  oats\n\n  milk  \n")
        assertEquals(listOf("oats", "milk"), doc.rawIngredients)
    }

    @Test
    fun `ingest sets name and servings to null`() {
        val doc = service.ingest("Plain text recipe")
        assertNull(doc.name)
        assertNull(doc.servings)
    }

    @Test
    fun `ingest passes full raw text as instructions`() {
        val input = "2 cups flour\n1 egg"
        val doc = service.ingest(input)
        assertEquals(input, doc.instructions)
    }
}
