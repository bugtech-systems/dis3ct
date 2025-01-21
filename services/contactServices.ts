import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import Contact, { IContact } from "@/models/Contact";

/**
 * Create a new contact.
 * @param {Partial<IContact>} data - Contact data to create.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const createContact = async (
  data: Partial<IContact>
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const newContact = new Contact({...data, phone: sanitizePhoneNumber(data.phone)});
    const savedContact = await newContact.save();
    return { success: true, data: savedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create contact" };
  }
};

/**
 * Update an existing contact by ID.
 * @param {string} id - Contact ID to update.
 * @param {Partial<IContact>} data - Updated contact data.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const updateContact = async (
  id: string,
  data: Partial<IContact>
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const updatedContact = await Contact.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedContact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: updatedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update contact" };
  }
};

/**
 * Delete a contact by ID.
 * @param {string} id - Contact ID to delete.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const deleteContact = async (
  id: string
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const deletedContact = await Contact.findByIdAndUpdate(id, {isDeleted: true}, {
        new: true,
        runValidators: true,
      });
    if (!deletedContact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: deletedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete contact" };
  }
};

/**
 * Get all contacts.
 * @returns {Promise<{ success: boolean; data?: IContact[]; error?: string }>}
 */
export const getAllContacts = async (): Promise<{
  success: boolean;
  data?: IContact[];
  error?: string;
}> => {
  try {
    await dbConnect();
    const contacts = await Contact.find({ isDeleted: false});
    return { success: true, data: contacts };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch contacts" };
  }
};

/**
 * Get a contact by number.
 * @param {string} number - Contact number to search for.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const getContactByNumber = async (
  number: string | null
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const contact = await Contact.findOne({ phone: sanitizePhoneNumber(number) });
    if (!contact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: contact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch contact" };
  }
};


export const getContactById = async (
  id: string | null
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const contact = await Contact.findById(id);
    if (!contact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: contact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch contact" };
  }
};

/**
 * Opt-in a contact by number.
 * @param {string} number - Contact number to opt-in.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const optInContact = async (
  number: string
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const updatedContact = await Contact.findOneAndUpdate(
      { phone: number },
      { optedIn: true },
      { new: true, runValidators: true }
    );
    if (!updatedContact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: updatedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to opt-in contact" };
  }
};

/**
 * Opt-out a contact by number.
 * @param {string} number - Contact number to opt-out.
 * @returns {Promise<{ success: boolean; data?: IContact; error?: string }>}
 */
export const optOutContact = async (
  number: string
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const updatedContact = await Contact.findOneAndUpdate(
      { phone: number },
      { optedIn: false },
      { new: true, runValidators: true }
    );
    if (!updatedContact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: updatedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to opt-out contact" };
  }
};


export const setContactPreset = async (
  number: string | null,
  preset: string | null
): Promise<{ success: boolean; data?: IContact; error?: string }> => {
  try {
    await dbConnect();
    const updatedContact = await Contact.findOneAndUpdate(
      { phone: sanitizePhoneNumber(number) },
      { activePreset: preset },
      { new: true, runValidators: true }
    );
    if (!updatedContact) {
      return { success: false, error: "Contact not found" };
    }
    return { success: true, data: updatedContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to opt-out contact" };
  }
};