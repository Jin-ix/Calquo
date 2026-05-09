#!/bin/bash

# Fix the button text in ModernBuyerFocusedProductDetail.tsx
FILE="components/stock/ModernBuyerFocusedProductDetail.tsx"

# Create backup
cp "$FILE" "$FILE.backup"

# Use sed to replace line 1252 (Send icon to CreditCard icon)
sed -i '1252s/Send className/CreditCard className/' "$FILE"

# Use sed to replace line 1253 (button text)
sed -i '1253s/Send Purchase Request/Select Payment Method/' "$FILE"

echo "✅ Updated button text!"
echo "Line 1252: Changed Send icon to CreditCard icon"
echo "Line 1253: Changed 'Send Purchase Request' to 'Select Payment Method'"
echo ""
echo "Backup saved to: $FILE.backup"
