import prisma from '../config/database.js';

export class RecipeService {
    async getByProduct(productId: string, businessId: string) {
        return prisma.recipe.findMany({
            where: { productId, businessId },
            include: {
                ingredient: true
            }
        });
    }

    async updateRecipe(productId: string, businessId: string, ingredients: Array<{ ingredientId: string; quantity: number }>) {
        return prisma.$transaction(async (tx) => {
            // Clean existing
            await tx.recipe.deleteMany({
                where: { productId, businessId }
            });

            // Create new
            if (ingredients.length > 0) {
                await tx.recipe.createMany({
                    data: ingredients.map(i => ({
                        businessId,
                        productId,
                        ingredientId: i.ingredientId,
                        quantity: i.quantity
                    }))
                });
            }

            return tx.recipe.findMany({
                where: { productId, businessId },
                include: { ingredient: true }
            });
        });
    }

    // Deduct stock based on recipe
    async deductStockByRecipe(businessId: string, productId: string, orderQuantity: number) {
        const recipe = await this.getByProduct(productId, businessId);
        if (recipe.length === 0) return;

        for (const item of recipe) {
            const neededQuantity = Number(item.quantity) * orderQuantity;
            const inv = await prisma.inventory.findFirst({
                where: { productId: item.ingredientId, businessId }
            });

            if (inv) {
                await prisma.inventory.update({
                    where: { id: inv.id },
                    data: {
                        quantity: {
                            decrement: Math.ceil(neededQuantity) // Or handle decimals if quantity is decimal
                        }
                    }
                });
            }
        }
    }
}
