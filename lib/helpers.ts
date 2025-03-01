import { parse } from 'node-html-parser';
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

// export function convertRichTextToPlain(content: string): string {
//   // Create a temporary DOM element to parse HTML
//   const tempDiv = document.createElement("div");
//   tempDiv.innerHTML = content;

//   // Remove specific tags like <script>, <style>, etc.
//   const disallowedTags = ["script", "style"];
//   disallowedTags.forEach((tag) => {
//     const elements = tempDiv.getElementsByTagName(tag);
//     while (elements.length > 0) {
//       elements[0].parentNode?.removeChild(elements[0]);
//     }
//   });

//   // Replace <br>, <p>, and similar block-level tags with newlines
//   tempDiv.innerHTML = tempDiv.innerHTML
//     .replace(/<br\s*\/?>/gi, "\n")
//     .replace(/<\/p>/gi, "\n")
//     .replace(/<\/h[1-6]>/gi, "\n")
//     .replace(/<li>/gi, "- ")
//     .replace(/<\/li>/gi, "\n")
//     .replace(/<\/ul>/gi, "\n")
//     .replace(/<\/ol>/gi, "\n");

//   // Strip remaining HTML tags
//   const plainText = tempDiv.textContent || tempDiv.innerText || "";

//   // Normalize newlines and trim extra spaces
//   return plainText
//     .replace(/\n\s*\n/g, "\n") // Remove multiple consecutive newlines
//     .trim(); // Trim leading and trailing spaces
// }

export function cleanJsonObject(inputString: any) {
  try {
    // Remove non-breaking spaces (&nbsp;) and other extra characters
    const sanitizedString = inputString
      .replace(/&nbsp;/g, " ") // Replace HTML non-breaking spaces with regular spaces
      .replace(/\s*[\r\n]+\s*/g, "") // Remove extra newlines and surrounding spaces
      .replace(/,\s*}/g, "}"); // Remove trailing commas before closing braces

    // Parse the cleaned string to ensure it's valid JSON

    return sanitizedString;
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }
}
/**
 * Extracts and validates a JSON object from a given string.
 * @param input - The string containing a potential JSON object.
 * @returns The cleaned JSON object as a string if valid, otherwise null.
 */
/**
 * Extracts and validates a JSON object from a given string.
 * @param input - The string containing a potential JSON object.
 * @returns The cleaned JSON object as a string if valid, otherwise null.
 */
export function cleanToJson(input: any | null) {
  try {
    // Use a regex to find the JSON object in the string
    const jsonMatch = input.match(/{[\s\S]*}/); // Match anything starting with `{` and ending with `}`, including newlines

    if (jsonMatch && jsonMatch[0]) {
      const cleanedJsonString = jsonMatch[0]; // Extract the matched JSON part

      // Try to parse it to confirm it's valid JSON
      JSON.parse(cleanedJsonString);

      return cleanedJsonString;
    } else {
      throw new Error("No JSON object found in the string.");
    }
  } catch (error) {
    console.error("Error cleaning JSON string:", (error as Error).message);
    return null;
  }
}



export function convertRichTextToPlain(content: string): string {
  // Parse the HTML content
  const document = parseDocument(content);

  // Extract text content, ignoring tags
  const plainText = DomUtils.getText(document);
  // Normalize newlines and trim extra spaces
  return plainText
    .replace(/\n\s*\n/g, "\n") // Remove multiple consecutive newlines
    .trim(); // Trim leading and trailing spaces
}






export function isParsableObject(value: any) {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
}

export function textToQuillHTML(text: any) {
  // Escape HTML special characters to prevent injection
  const lines = text.split('\n');

  // Initialize variables to build the HTML content
  let htmlContent = '';
  let inList = false;

  // Iterate over each line to identify and convert formatting markers
  lines.forEach((line: any) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('* ')) {
      // Handle unordered list items
      if (!inList) {
        htmlContent += '<ul>';
        inList = true;
      }
      htmlContent += `<li>${trimmedLine.substring(2)}</li>`;
    } else if (trimmedLine.match(/^\d+\. /)) {
      // Handle ordered list items
      if (!inList) {
        htmlContent += '<ol>';
        inList = true;
      }
      htmlContent += `<li>${trimmedLine.replace(/^\d+\. /, '')}</li>`;
    } else {
      // Handle regular paragraphs
      if (inList) {
        // Close any open list tags
        htmlContent += trimmedLine.startsWith('* ') ? '</ul>' : '</ol>';
        inList = false;
      }
      if (trimmedLine) {
        htmlContent += `<p>${trimmedLine}</p>`;
      }
    }
  });

  // Close any remaining open list tags
  if (inList) {
    htmlContent += htmlContent.includes('<ul>') ? '</ul>' : '</ol>';
  }

  return htmlContent;
}


/**
 * Formats HTML content from React Quill to a structured, AI-readable format.
 * @param quillContent - The HTML string from React Quill.
 * @returns A structured AI-readable prompt string.
 */



export function convertQuillToPlainText(quillContent: string): string {
  // Parse the HTML content
  const root = parse(quillContent);

  /**
   * Recursively processes the node to extract meaningful text and structure.
   * @param node - HTML node to process.
   * @returns A structured text representation of the node.
   */

  const processNode = (node: any): string => {
    if (!node) return '';

    if (node.nodeType === 3) {
      // Text node
      return node.rawText.trim();
    }

    switch (node.tagName) {
      case 'H1':
        return `# ${node.rawText.trim()}\n`;
      case 'H2':
        return `## ${node.rawText.trim()}\n`;
      case 'H3':
        return `### ${node.rawText.trim()}\n`;
      case 'P':
        return `${node.rawText.trim()}\n`;
      case 'B':
      case 'STRONG':
        return `**${node.rawText.trim()}**`;
      case 'I':
      case 'EM':
        return `*${node.rawText.trim()}*`;
      case 'UL':
        return node.childNodes
          .map((child: any) => `- ${processNode(child)}`)
          .join('\n');
      case 'OL':
        return node.childNodes
          .map((child: any, index: number) => `${index + 1}. ${processNode(child)}`)
          .join('\n');
      case 'LI':
        return `${node.rawText.trim()}`;
      case 'BLOCKQUOTE':
        return `> ${node.rawText.trim()}`;
      case 'A':
        return `[${node.rawText.trim()}](${node.getAttribute('href') || '#'})`;
      default:
        // For unhandled tags, return raw text
        return node.rawText.trim();
    }
  };

  // Process all top-level child nodes
  const formattedContent = root.childNodes
    .map((child: any) => processNode(child))
    .filter((line: string) => line?.trim().length > 0) // Filter out empty lines
    .join('\n');

  // Wrap in AI-friendly structure
  return formattedContent;
}


export function sanitizePhoneNumber(phoneNumber: any) {
  // Remove any non-numeric characters from the phone number
  const sanitized = String(phoneNumber).replace(/\D/g, '');

  if (sanitized.length > 12) return null;


  // Check for common prefixes and remove them
  if (sanitized.startsWith('09')) {
    return sanitized.slice(1); // Remove the '09' prefix
  } else if (sanitized.startsWith('639')) {
    return sanitized.slice(2); // Remove the '639' prefix
  } else if (sanitized.startsWith('+639')) {
    return sanitized.slice(3); // Remove the '+639' prefix
  } else if (sanitized.length === 10) {
    return sanitized; // Already a 10-digit number
  } else {
    return null;
  }

  // If the number is not in a valid format, return null or throw an error
}

export function checkContactId(contactId: any) {

  if (!contactId) return null
  if (contactId.length > 13) return contactId;

  return sanitizePhoneNumber(contactId);

}



export function internationalizePhoneNumber(phoneNumber: any) {
  // Remove any non-numeric characters from the phone number
  if (!phoneNumber) return null;
  const sanitized = phoneNumber.replace(/\D/g, '');

  if (sanitized.length > 12) throw Error('Invalid phone number format');


  // Check for common prefixes and remove them
  if (sanitized.startsWith('09')) {
    return '+63' + sanitized.slice(1); // Remove the '09' prefix
  } else if (sanitized.startsWith('639')) {
    return '+' + sanitized; // Remove the '639' prefix
  } else if (sanitized.startsWith('+639')) {
    return sanitized; // Remove the '+639' prefix
  } else if (sanitized.length === 10 && sanitized.startsWith('9')) {
    return '+63' + sanitized; // Already a 10-digit number
  }

  // If the number is not in a valid format, return null or throw an error
  throw phoneNumber;
}



export function sanitizeObject<T>(data: T): T {
  if (!data) return data;

  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "object" && value !== null) {
        // Convert MongoDB ObjectId to a string
        if (value._bsontype === "ObjectId") {
          return value.toString();
        }

        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
      }
      return value;
    })
  );
}

export function mergeUniqueObjects(existingArray: any, newArray: any) {
  const existingIds = new Set(existingArray.map(obj => obj._id));

  newArray.forEach(obj => {
    if (!existingIds.has(obj._id)) {
      existingArray.push(obj);
      existingIds.add(obj._id); // Add to set to avoid duplicate checks
    }
  });

  return existingArray;
}