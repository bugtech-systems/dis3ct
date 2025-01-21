import dbConnect from "@/lib/mongodb";
import AiPreset, { IAiPreset } from "@/models/AiPreset";
import { IConversation } from "@/models/Conversation";

/**
 * Create a new AI Preset.
 * @param {Partial<IAiPreset>} data - The preset data to create.
 * @returns {Promise<{ success: boolean; data?: IAiPreset; error?: string }>}
 */
export const createPreset = async (
  data: Partial<IAiPreset>
): Promise<{ success: boolean; data?: IAiPreset; error?: string }> => {
  try {
    await dbConnect();
    let newData = data;
    
    newData.value = String(data.name).toLowerCase().split(' ').join('_');
    
    
      const existingSystem = await AiPreset.findOne({ value: newData.value });
      if (existingSystem) {
        return {
          success: false,
          error: `An active system with the number "${data.name}" already exists.`,
        };
      }
  
    
    

    const newPreset = new AiPreset(newData);
    const savedPreset = await newPreset.save();
    return { success: true, data: savedPreset };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create preset" };
  }
};

/**
 * Get all AI Presets.
 * @returns {Promise<{ success: boolean; data?: IAiPreset[]; error?: string }>}
 */
export const getAllPresets = async (): Promise<{
  success: boolean;
  data?: IAiPreset[];
  error?: string;
}> => {
  try {
    await dbConnect();
    const presets = await AiPreset.find();
    return { success: true, data: presets };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch presets" };
  }
};

/**
 * Get a specific AI Preset by ID.
 * @param {string} id - The preset ID.
 * @returns {Promise<{ success: boolean; data?: IAiPreset; error?: string }>}
 */
export const getPresetById = async (
  id: string
): Promise<{ success: boolean; data?: IAiPreset; error?: string }> => {
  try {
    await dbConnect();
    const preset = await AiPreset.findById(id);
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }
    return { success: true, data: preset };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch preset" };
  }
};

export const getPresetConvosById = async (
  id: string | null
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    await dbConnect();
    const preset = await AiPreset.findById(id).populate('sampleConversation');
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }
    return { success: true, data: preset.sampleConversation };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch preset" };
  }
};

/**
 * Get a specific AI Preset by ID.
 * @param {string} value - The preset ID.
 * @returns {Promise<{ success: boolean; data?: IAiPreset; error?: string }>}
 */
export const getPresetByValue = async (
  value: string | null
): Promise<{ success: boolean; data?: IAiPreset; error?: string }> => {
  try {
    await dbConnect();
    const preset = await AiPreset.findOne({value: value});
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }
    return { success: true, data: preset };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch preset" };
  }
};

/**
 * Update an AI Preset by ID.
 * @param {string} id - The preset ID.
 * @param {Partial<IAiPreset>} data - The data to update.
 * @returns {Promise<{ success: boolean; data?: IAiPreset; error?: string }>}
 */
export const updatePreset = async (
  id: string,
  data: Partial<IAiPreset>
): Promise<{ success: boolean; data?: IAiPreset; error?: string }> => {
  try {
    await dbConnect();
    const updatedPreset = await AiPreset.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedPreset) {
      return { success: false, error: "Preset not found" };
    }
    return { success: true, data: updatedPreset };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update preset" };
  }
};
