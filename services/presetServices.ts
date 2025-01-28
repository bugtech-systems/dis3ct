import dbConnect from "@/lib/mongodb";
import AiPreset, { IAiPreset } from "@/models/AiPreset";
import { IConversation } from "@/models/Conversation";
import { getContactByNumber } from "./contactServices";
import { sanitizePhoneNumber } from "@/lib/helpers";

/**
 * Create a new AI Preset.
 * @param {Partial<IAiPreset>} data - The preset data to create.
 * @returns {Promise<{ success: boolean; data?: IAiPreset; error?: string }>}
 */
export const createPreset = async (
  data: any
): Promise<{ success: boolean; data?: IAiPreset; error?: string }> => {
  try {
    await dbConnect();
    let newData = data;
    newData.value = String(data.name).toLowerCase().split(' ').join('_');


    let senderContact = await getContactByNumber(sanitizePhoneNumber(newData?.system));

    let options = { value: newData.value } as any;


    if (senderContact.data) {
      options.contact = senderContact.data.id;
    }



    console.log(data, 'PRESET DATA')


    const existingSystem = await AiPreset.findOne(options);
    if (existingSystem) {
      const updatedPreset = await AiPreset.findByIdAndUpdate(existingSystem._id, data, {
        new: true,
        runValidators: true,
      });
      return {
        success: true
      };
    } else {

      delete newData?._id;

      const newPreset = new AiPreset({ ...newData, contact: senderContact?.data?.id });
      const savedPreset = await newPreset.save();
      return { success: true, data: savedPreset };
    }



  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create preset" };
  }
};

/**
 * Get all AI Presets.
 * @returns {Promise<{ success: boolean; data?: IAiPreset[]; error?: string }>}
 */
export const getAllPresets = async (options: any): Promise<{
  success: boolean;
  data?: IAiPreset[];
  error?: string;
}> => {
  try {
    await dbConnect();
    const presets = await AiPreset.find(options);
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
    const preset = await AiPreset.findOne({ value: value });
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
