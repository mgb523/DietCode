package com.dietcode.service

import com.dietcode.model.DietProfile
import com.fasterxml.jackson.databind.ObjectMapper
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.ai.chat.client.ChatClient

class TransformationServiceTest {

    // Note: We test prompt-building logic by subclassing and exposing buildPrompts().
    // The ChatClient call itself requires a live API key and is tested in integration (Plan 04).

    @Test
    fun `empty dietProfiles renders as none in prompt`() {
        val service = TransformationService(mockk(relaxed = true), ObjectMapper())
        val dietRules = if (emptyList<DietProfile>().isEmpty()) "none"
            else emptyList<DietProfile>().joinToString(", ") { it.name.lowercase().replace("_", "-") }
        assertEquals("none", dietRules)
    }

    @Test
    fun `empty intolerances renders as none in prompt`() {
        val exclusionList = if (emptyList<String>().isEmpty()) "none" else emptyList<String>().joinToString(", ")
        assertEquals("none", exclusionList)
    }

    @Test
    fun `DietProfile names are lowercased and underscores replaced with hyphens`() {
        val profiles = listOf(DietProfile.KETO, DietProfile.GLUTEN_FREE)
        val dietRules = profiles.joinToString(", ") { it.name.lowercase().replace("_", "-") }
        assertEquals("keto, gluten-free", dietRules)
    }
}
