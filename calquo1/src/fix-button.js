const fs = require('fs');

// Read the file
const filePath = './components/stock/ModernBuyerFocusedProductDetail.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Update line 1252 (index 1251) - Change Send icon to CreditCard
if (lines[1251] && lines[1251].includes('Send className="h-4 w-4 mr-2"')) {
  lines[1251] = lines[1251].replace('<Send className="h-4 w-4 mr-2" />', '<CreditCard className="h-4 w-4 mr-2" />');
  console.log('✅ Line 1252: Changed Send icon to CreditCard icon');
} else {
  console.log('⚠️  Line 1252: Could not find Send icon');
}

// Update line 1253 (index 1252) - Change button text
if (lines[1252] && lines[1252].includes('Send Purchase Request')) {
  lines[1252] = lines[1252].replace('Send Purchase Request', 'Select Payment Method');
  console.log('✅ Line 1253: Changed "Send Purchase Request" to "Select Payment Method"');
} else {
  console.log('⚠️  Line 1253: Could not find "Send Purchase Request"');
}

// Write back to file
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\n✅ File updated successfully!');
console.log('\nUpdated lines:');
console.log(`1252: ${lines[1251]}`);
console.log(`1253: ${lines[1252]}`);
