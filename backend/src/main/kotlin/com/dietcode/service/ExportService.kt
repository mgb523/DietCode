package com.dietcode.service

import com.dietcode.model.TransformedRecipe
import org.springframework.stereotype.Service

@Service
class ExportService {
    fun serialize(recipe: TransformedRecipe): Map<String, Any> {
        TODO("Phase 4: Serialize for frontend export endpoints (print, Drive)")
    }
}
