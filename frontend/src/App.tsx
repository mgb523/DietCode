import { RecipeCard } from "@/components/RecipeCard"

const STUB_RECIPE = {
  recipeName: "Vegan Chocolate Chip Cookies (Stub)",
  ingredients: [
    { quantity: "2", unit: "cups", ingredient: "oat flour", preparation: null, substitutionNote: null },
    { quantity: "1/2", unit: "cup", ingredient: "coconut oil", preparation: "melted", substitutionNote: null },
    { quantity: "3/4", unit: "cup", ingredient: "maple syrup", preparation: null, substitutionNote: null },
    {
      quantity: "1",
      unit: "cup",
      ingredient: "vegan chocolate chips",
      preparation: null,
      substitutionNote: "Substituted dairy chocolate chips — free of milk solids"
    }
  ],
  instructions: [
    "Preheat oven to 350°F (175°C).",
    "Whisk together oat flour and a pinch of salt in a large bowl.",
    "In a separate bowl, combine melted coconut oil and maple syrup.",
    "Fold wet ingredients into dry until just combined, then stir in chocolate chips.",
    "Drop by rounded tablespoons onto a parchment-lined baking sheet.",
    "Bake 12 minutes until edges are set. Cool on the pan for 5 minutes."
  ],
  servings: 24,
  warnings: ["Oat flour replaces all-purpose flour — cookies will be denser and more crumbly than the original."]
}

export default function App() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-2xl font-bold text-center mb-8">DietCode</h1>
      <RecipeCard recipe={STUB_RECIPE} />
    </main>
  )
}
