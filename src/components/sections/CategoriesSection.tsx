import { useState } from 'react'

import { withErrorBoundary } from '@/components/ErrorBoundary'
import { CategoryPills } from '@/components/listings/CategoryPills'
import { QueryGuard } from '@/components/QueryGuard'

const CategoriesSection = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Find the perfect party vendors for your celebration
          </p>
        </div>

        <QueryGuard>
          <CategoryPills
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </QueryGuard>
      </div>
    </section>
  )
}

export default withErrorBoundary(CategoriesSection)
