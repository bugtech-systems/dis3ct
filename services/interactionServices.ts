// services/interactionService.ts
import Interaction, { IInteraction } from '@/models/Interaction';
import dbConnect from "@/lib/mongodb";

/**
 * Create a new interaction.
 * @param {Partial<IInteraction>} data - Interaction data to create.
 * @returns {Promise<{ success: boolean; data?: IInteraction; error?: string }>}
 */
export const createInteraction = async (
    data: Partial<IInteraction>
): Promise<{ success: boolean; data?: IInteraction; error?: string }> => {
    try {
        await dbConnect();
        const newInteraction = new Interaction(data);
        const savedInteraction = await newInteraction.save();
        return { success: true, data: savedInteraction };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create interaction' };
    }
};

/**
 * Update feedback for an existing interaction.
 * @param {string} interactionId - The ID of the interaction to update.
 * @param {Partial<IInteraction['feedback']>} feedback - The feedback data to update.
 * @returns {Promise<{ success: boolean; data?: IInteraction; error?: string }>}
 */
export const updateFeedback = async (
    interactionId: string,
    feedback: Partial<IInteraction['feedback']>
): Promise<{ success: boolean; data?: IInteraction; error?: string }> => {
    try {
        await dbConnect();
        const updatedInteraction = await Interaction.findByIdAndUpdate(
            interactionId,
            { feedback },
            { new: true }
        );
        if (!updatedInteraction) {
            return { success: false, error: 'Interaction not found' };
        }
        return { success: true, data: updatedInteraction };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update feedback' };
    }
};

/**
 * Retrieve all interactions for a specific user.
 * @param {string} userId - The ID of the user whose interactions to retrieve.
 * @returns {Promise<{ success: boolean; data?: IInteraction[]; error?: string }>}
 */
export const getUserInteractions = async (
    contact: string
): Promise<{ success: boolean; data?: IInteraction[]; error?: string }> => {
    try {
        await dbConnect();
        const interactions = await Interaction.find({ contact });
        return { success: true, data: interactions };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch interactions' };
    }
};
