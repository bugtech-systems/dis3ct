import Conversation, { IConversation } from "@/models/Conversation";
import dbConnect from "@/lib/mongodb";
import { getContactByNumber } from "./contactServices";
import { sanitizePhoneNumber } from "@/lib/helpers";


const convertToAndCondition = (option: any) => {
  if (!option || typeof option !== "object") {
    throw new Error("Invalid option provided. Must be an object.");
  }

  let options = [] as any;
  Object.entries(option).map(([key, value]) => {
    if (value && value != 'undefined')
      options.push({ [key]: value })
  })
  // Convert each key-value pair to a separate condition in the $and array
  return {
    $and: options
  };
};

/**
 * Get conversations for a specific contact, sorted by timestamp.
 * @param {string} phone - The contact ID.
 * @returns {Promise<{ success: boolean; data?: IConversation[]; error?: string }>}
 */
export const getContactConversations = async (
  phone: string | null
): Promise<{ success: boolean; data?: IConversation[]; error?: string }> => {
  try {
    await dbConnect();

    let contact = null;

    let response = await getContactByNumber(phone)
    if (response.data) {
      contact = response.data;
    }


    const conversations = await Conversation.find({ contact })
      .sort({ createdAt: 1 }) // Sort by `createdAt` in ascending order
      .exec();

    return { success: true, data: conversations };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch conversations" };
  }
};

/**
 * Create a new conversation.
 * @param {Partial<IConversation>} data - Conversation data to create.
 * @returns {Promise<{ success: boolean; data?: IConversation; error?: string }>}
 */
export const createConversation = async (
  data: Partial<IConversation>
): Promise<{ success: boolean; data?: IConversation; error?: string }> => {
  try {
    await dbConnect();
    const newConversation = new Conversation(data);
    const savedConversation = await newConversation.save();

    return { success: true, data: savedConversation };
  } catch (error: any) {
    console.log(error, 'CONVO ERROR')
    return { success: false, error: error.message || "Failed to create conversation" };
  }
};

/**
 * Update a conversation by ID.
 * @param {string} id - Conversation ID.
 * @param {Partial<IConversation>} data - Data to update the conversation.
 * @returns {Promise<{ success: boolean; data?: IConversation; error?: string }>}
 */
export const updateConversation = async (
  id: string,
  data: Partial<IConversation>
): Promise<{ success: boolean; data?: IConversation; error?: string }> => {
  try {
    await dbConnect();
    const updatedConversation = await Conversation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedConversation) {
      return { success: false, error: "Conversation not found" };
    }
    return { success: true, data: updatedConversation };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update conversation" };
  }
};

/**
 * Delete a conversation by ID.
 * @param {string} id - Conversation ID to delete.
 * @returns {Promise<{ success: boolean; data?: IConversation; error?: string }>}
 */
export const deleteConversation = async (
  id: string
): Promise<{ success: boolean; data?: IConversation; error?: string }> => {
  try {
    await dbConnect();
    const deletedConversation = await Conversation.findByIdAndDelete(id);
    if (!deletedConversation) {
      return { success: false, error: "Conversation not found" };
    }
    return { success: true, data: deletedConversation };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete conversation" };
  }
};

/**
 * Get a conversation by ID.
 * @param {string} id - Conversation ID to retrieve.
 * @returns {Promise<{ success: boolean; data?: IConversation; error?: string }>}
 */
export const getConversationById = async (
  id: string
): Promise<{ success: boolean; data?: IConversation; error?: string }> => {
  try {
    await dbConnect();
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }
    return { success: true, data: conversation };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch conversation" };
  }
};


/**
 * Get all conversations.
 * @returns {Promise<{ success: boolean; data?: IConversation[]; error?: string }>}
 */
export const getAllConversations = async (option: any): Promise<{
  success: boolean;
  data?: IConversation[];
  error?: string;
}> => {
  try {
    await dbConnect();

    let newOptions = convertToAndCondition(option);

    const conversations = await Conversation.find(newOptions).populate([
      { path: "contact", select: "name phone" }, // Populate contact with specific fields
      { path: "system", select: "name phone" }, // Populate system with specific fields
      { path: "preset", select: "name value description" }, // Populate preset with specific fields
    ]).sort({ createdAt: 1 }).limit(100).lean();

    console.log(conversations[0], 'convo')
    return { success: true, data: conversations };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch conversations" };
  }
};


export const updateAllPendingConversationsToClose = async (sender: any, system: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await dbConnect();

    // let newOptions = convertToAndCondition(option);



    let senderContact = await getContactByNumber(sanitizePhoneNumber(sender));
    let systemContact = await getContactByNumber(sanitizePhoneNumber(system));

    let newOptions = {
      contact: senderContact.data?._id,
      system: systemContact.data?._id
    }

    console.log('GET ALL CONVO', newOptions)
    await Conversation.updateMany({ ...newOptions, status: 'pending' }, { status: 'closed' }, {
      new: true,
      runValidators: true,
    })


    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch conversations" };
  }
};