// services/interactionService.ts
import Interaction, { IInteraction } from '@/models/Interaction';
import dbConnect from "@/lib/mongodb";
import { removeNullishValues, sanitizePhoneNumber } from '@/lib/helpers';
import Resource from '@/models/Resource';

/**
 * Create a new interaction.
 * @param {Partial<IInteraction>} data - Interaction data to create.
 * @returns {Promise<{ success: boolean; data?: IInteraction; error?: string }>}
 */
export const createInteraction = async (
    data: any
): Promise<{ success: boolean; data?: IInteraction; error?: string }> => {
    try {
        await dbConnect();

        const newInteraction = new Interaction({ ...data, contact: data?.contact ? data?.contact : data.system });
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

export const updateInteraction = async (
    interactionId: string,
    data: any
): Promise<{ success: boolean; data?: IInteraction; error?: string }> => {
    try {
        await dbConnect();
        console.log(data, 'DATA INTERACT')
        const updatedInteraction = await Interaction.findByIdAndUpdate(
            interactionId,
            data,
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
    options?: any,
    limit?: any,
    sort?: any
): Promise<{ success: boolean; data?: IInteraction[]; error?: string }> => {
    try {
        await dbConnect();

        let newOptions = removeNullishValues(options);
        if (newOptions.status == 'active') {
            delete newOptions.status;
            newOptions.status = 'pending'
            // newOptions.$or = [{ status: 'pending' }, { status: 'closed' }]
        }

        const interactions = await Interaction.find(newOptions).limit(limit || 100).sort(sort || { timestamp: -1 });
        return { success: true, data: interactions };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch interactions' };
    }
};

export const getUserIntent = async (
    intent?: any,
    system?: any
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        await dbConnect();


        const intentData = await Resource.find({ type: 'intent', value: intent, system: sanitizePhoneNumber(system) }).lean()
        const interactions = await Interaction.find({ system: sanitizePhoneNumber(system), intent, status: 'default' }).limit(100).sort({ timestamp: -1 });




        return { success: true, data: { ...intentData, interactions } };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch interactions' };
    }
};


export const getInteractionById = async (
    id: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        await dbConnect();
        const conversation = await Interaction.findById(id);
        if (!conversation) {
            return { success: false, error: "Conversation not found" };
        }
        return { success: true, data: conversation };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch conversation" };
    }
};


export const deleteInteraction = async (
    id: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        await dbConnect();
        const deletedConversation = await Interaction.findByIdAndDelete(id);
        if (!deletedConversation) {
            return { success: false, error: "Conversation not found" };
        }
        return { success: true, data: deletedConversation };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete conversation" };
    }
};


export const clearInteraction = async (
    contact?: string | null,
    system?: string | null
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        await dbConnect();
        const deletedConversation = await Interaction.deleteMany({
            contact: sanitizePhoneNumber(contact),
            system: sanitizePhoneNumber(system),
            status: 'pending'
        });
        if (!deletedConversation) {
            return { success: false, error: "Conversation not found" };
        }
        return { success: true, data: deletedConversation };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete conversation" };
    }
};