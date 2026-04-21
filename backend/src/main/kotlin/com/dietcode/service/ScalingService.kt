package com.dietcode.service

import com.dietcode.model.TransformedRecipe
import org.springframework.stereotype.Service

@Service
class ScalingService {
    fun scale(recipe: TransformedRecipe, targetServings: Int): TransformedRecipe {
        TODO("Phase 3: Apply sub-linear scaling rules for leavening, salt, spices; linear for other ingredients")
    }
}
