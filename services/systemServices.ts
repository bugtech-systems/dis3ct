import System, { ISystem } from "@/models/System"; // Assuming the System model is typed
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { any } from "zod";
import { sanitizeFilter } from "mongoose";

/**
 * Create a new System.
 * @param {Partial<ISystem>} data - The system data to create.
 * @returns {Promise<{ success: boolean; data?: ISystem; error?: string }>}
 */
export const createSystem = async (
  data: Partial<ISystem>
): Promise<{ success: boolean; data?: ISystem; error?: string }> => {
  try {
    await dbConnect();

    // Check if an active system with the same number already exists
    const existingSystem = await System.findOne({ number: data.number, isActive: true });
    if (existingSystem) {
      return {
        success: false,
        error: `An active system with the number "${data.number}" already exists.`,
      };
    }

    // Create the new system
    const newSystem = new System(data);
    const savedSystem = await newSystem.save();
    return { success: true, data: savedSystem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create system" };
  }
};

/**
 * Get all Systems.
 * @returns {Promise<{ success: boolean; data?: ISystem[]; error?: string }>}
 */
export const getAllSystems = async (): Promise<{
  success: boolean;
  data?: ISystem[];
  error?: string;
}> => {
  try {
    await dbConnect();
    const systems = await System.find();
    return { success: true, data: systems };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch systems" };
  }
};

/**
 * Update a System by ID.
 * @param {string} id - The system ID.
 * @param {Partial<ISystem>} data - The data to update.
 * @returns {Promise<{ success: boolean; data?: ISystem; error?: string }>}
 */
export const updateSystem = async (
  id: string,
  data: Partial<ISystem>
): Promise<{ success: boolean; data?: ISystem; error?: string }> => {
  try {
    await dbConnect();
    const updatedSystem = await System.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedSystem) {
      return { success: false, error: "System not found" };
    }
    return { success: true, data: updatedSystem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update system" };
  }
};

/**
 * Delete a System by ID.
 * @param {string} id - The system ID.
 * @returns {Promise<{ success: boolean; data?: ISystem; error?: string }>}
 */
export const deleteSystem = async (
  id: string
): Promise<{ success: boolean; data?: ISystem; error?: string }> => {
  try {
    await dbConnect();
    const deletedSystem = await System.findByIdAndDelete(id);
    if (!deletedSystem) {
      return { success: false, error: "System not found" };
    }
    return { success: true, data: deletedSystem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete system" };
  }
};

/**
 * Updates the totalSent, totalFailed, and credits fields in the System table.
 * @param {string} systemId - The ID of the system to update.
 * @param {boolean} isSuccessful - Whether the operation was successful or not.
 * @param {number} creditDeduction - Amount to deduct from credits for a successful send.
 * @returns {Promise<{ success: boolean; data?: ISystem; error?: string }>}
 */
export const updateSystemStats = async ({
  systemId,
  isSuccessful,
  creditDeduction = 1,
}: {
  systemId: string;
  isSuccessful: boolean;
  creditDeduction?: number;
}): Promise<{ success: boolean; data?: ISystem; error?: string }> => {
  try {
    await dbConnect();

    const system = await System.findById(systemId);

    if (!system) {
      return { success: false, error: "System not found" };
    }

    if (isSuccessful) {
      // Check if credits are sufficient
      if (system.credits < creditDeduction) {
        return { success: false, error: "Insufficient credits" };
      }

      // Increment totalSent and deduct credits
      system.totalSent += 1;
      system.credits -= creditDeduction;
    } else {
      // Increment totalFailed
      system.totalFailed += 1;
    }

    const updatedSystem = await system.save();
    return { success: true, data: updatedSystem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update system stats" };
  }
};


export const createSystemResource = async (
  data: any,
  system: any
): Promise<{ success: boolean; data?: ISystem; error?: string }> => {
  try {
    await dbConnect();

    // Check if an active system with the same number already exists
    const existingSystem = await User.findOne({ phone: sanitizeFilter(system), userType: 'system' });


    // Create the new system
    const newSystem = new System(data);
    const savedSystem = await newSystem.save();
    return { success: true, data: savedSystem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create system" };
  }
};