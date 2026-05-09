// Quick fix script to update the button text
// Run with: node fix-button-text.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'stock', 'ModernBuyerFocusedProductDetail.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the specific button text (second occurrence only - inside the dialog)
// We target it by finding the one that's followed by DialogFooter close
const before = '<Send className="h-4 w-4 mr-2" />\n                   Send Purchase Request\n                </Button>\n             </DialogFooter>\n          </DialogContent>\n       </Dialog>\n\n       {/* Multi-step Checkout */}';

const after = '<CreditCard className="h-4 w-4 mr-2" />\n                   Select Payment Method\n                </Button>\n             </DialogFooter>\n          </DialogContent>\n       </Dialog>\n\n       {/* Multi-step Checkout */}';

if (content.includes(before)) {
  content = content.replace(before, after);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated button text!');
  console.log('Changed: "Send Purchase Request" → "Select Payment Method"');
} else {
  console.log('❌ Could not find the exact text to replace.');
  console.log('You may need to manually update lines 1252-1253.');
}
