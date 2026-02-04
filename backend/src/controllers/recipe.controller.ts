import { Response } from 'express';
import { RecipeService } from '../services/recipe.service.js';
import { AuthRequest } from '../middleware/auth.js';

const recipeService = new RecipeService();

export class RecipeController {
    async getByProduct(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const data = await recipeService.getByProduct(id, req.user!.businessId);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { ingredients } = req.body;
            const data = await recipeService.updateRecipe(id, req.user!.businessId, ingredients);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
