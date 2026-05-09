/**
 * Safe clipboard utility with fallback for browsers that block Clipboard API
 */

/**
 * Safely copy text to clipboard with fallback methods
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Clipboard API blocked or failed, try fallback
      console.debug('Clipboard API blocked, using fallback method');
    }
  }

  // Method 2: Fallback using textarea method (works in most browsers)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    
    // Select the text
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    // Try to copy using execCommand (deprecated but still works as fallback)
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      return true;
    }
  } catch (fallbackError) {
    console.debug('Fallback copy method failed:', fallbackError);
  }

  // Method 3: Final fallback - create a selection range
  try {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.position = 'fixed';
    span.style.left = '-999999px';
    span.style.top = '-999999px';
    span.style.whiteSpace = 'pre';
    document.body.appendChild(span);

    const selection = window.getSelection();
    const range = document.createRange();
    
    if (selection) {
      selection.removeAllRanges();
      range.selectNode(span);
      selection.addRange(range);
      
      const successful = document.execCommand('copy');
      selection.removeAllRanges();
      document.body.removeChild(span);
      
      if (successful) {
        return true;
      }
    }
  } catch (finalError) {
    console.debug('Final fallback copy method failed:', finalError);
  }

  // All methods failed
  return false;
}

/**
 * Copy text to clipboard and show appropriate feedback
 * @param text - Text to copy
 * @param successMessage - Custom success message (optional)
 * @param errorMessage - Custom error message (optional)
 * @returns Promise that resolves to true if successful
 */
export async function copyWithFeedback(
  text: string,
  successMessage?: string,
  errorMessage?: string
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (success) {
    // Success feedback handled by caller (toast, etc.)
    return true;
  } else {
    // Show manual copy fallback
    if (window.confirm(
      errorMessage || 
      'Unable to copy automatically. Would you like to see the text to copy manually?'
    )) {
      // Create a modal/alert with selectable text
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 90%;
        max-height: 80vh;
        overflow: auto;
      `;
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;
      
      const title = document.createElement('h3');
      title.textContent = 'Copy This Text';
      title.style.cssText = 'margin: 0 0 12px 0; font-size: 18px; font-weight: 600;';
      
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = `
        width: 100%;
        min-height: 150px;
        font-family: monospace;
        font-size: 13px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-bottom: 12px;
      `;
      textarea.readOnly = true;
      
      const button = document.createElement('button');
      button.textContent = 'Close';
      button.style.cssText = `
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 8px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      `;
      
      const close = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
      };
      
      button.onclick = close;
      overlay.onclick = close;
      
      modal.appendChild(title);
      modal.appendChild(textarea);
      modal.appendChild(button);
      
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      
      // Auto-select the text
      textarea.select();
      textarea.focus();
    }
    
    return false;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
}
