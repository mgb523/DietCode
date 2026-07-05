package com.dietcode.service

import com.dietcode.exception.ScrapingException
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
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

    @Test
    fun `ingest routes to text path when input does not start with http`() {
        val doc = service.ingest("2 cups flour\n1 egg")
        assertEquals(listOf("2 cups flour", "1 egg"), doc.rawIngredients)
    }

    @Test
    fun `ingest throws ScrapingException for unreachable http URL`() {
        assertThrows(ScrapingException::class.java) {
            service.ingest("http://localhost:1/nonexistent")
        }
    }

    // extractInstructions — HowToSection handling (regression guard for RecipeTin Eats pattern)

    @Test
    fun `extractInstructions returns flat string wrapped in list`() {
        assertEquals(listOf("Do the thing"), service.extractInstructions("Do the thing"))
    }

    @Test
    fun `extractInstructions handles flat list of HowToStep maps`() {
        val steps = listOf(
            mapOf("@type" to "HowToStep", "text" to "Step 1"),
            mapOf("@type" to "HowToStep", "text" to "Step 2")
        )
        assertEquals(listOf("Step 1", "Step 2"), service.extractInstructions(steps))
    }

    @Test
    fun `extractInstructions expands HowToSection into section name followed by its steps`() {
        // Mirrors the RecipeTin Eats JSON-LD pattern: top-level HowToSection with itemListElement
        val input = listOf(
            mapOf("@type" to "HowToStep", "text" to "Preheat oven."),
            mapOf(
                "@type" to "HowToSection",
                "name" to "Beef Filling:",
                "itemListElement" to listOf(
                    mapOf("@type" to "HowToStep", "text" to "Cook onion."),
                    mapOf("@type" to "HowToStep", "text" to "Add beef.")
                )
            ),
            mapOf(
                "@type" to "HowToSection",
                "name" to "Serve:",
                "itemListElement" to listOf(
                    mapOf("@type" to "HowToStep", "text" to "Plate and enjoy.")
                )
            )
        )
        assertEquals(
            listOf("Preheat oven.", "Beef Filling:", "Cook onion.", "Add beef.", "Serve:", "Plate and enjoy."),
            service.extractInstructions(input)
        )
    }

    @Test
    fun `extractInstructions drops HowToSection with no itemListElement`() {
        val input = listOf(
            mapOf("@type" to "HowToSection", "name" to "Orphan Section:")
            // no itemListElement key at all
        )
        assertEquals(listOf("Orphan Section:"), service.extractInstructions(input))
    }

    @Test
    fun `extractInstructions returns empty list for null input`() {
        assertEquals(emptyList<String>(), service.extractInstructions(null))
    }
}
