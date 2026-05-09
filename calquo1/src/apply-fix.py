#!/usr/bin/env python3
"""
Script to update the button text from "Send Purchase Request" to "Select Payment Method"
Only updates the SECOND occurrence (the one in the dialog)
"""

import re

# Read the file
with open('components/stock/ModernBuyerFocusedProductDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Split by lines
lines = content.split('\n')

# Find line 1252 and 1253 (indices 1251 and 1252)
if len(lines) > 1253:
    # Check if line 1252 contains Send icon
    if 'Send className="h-4 w-4 mr-2"' in lines[1251]:
        # Replace the icon
        lines[1251] = lines[1251].replace('<Send className="h-4 w-4 mr-2" />', '<CreditCard className="h-4 w-4 mr-2" />')
        print("✅ Updated line 1252: Send → CreditCard icon")
    
    # Check if line 1253 contains "Send Purchase Request"
    if 'Send Purchase Request' in lines[1252]:
        # Replace the text
        lines[1252] = lines[1252].replace('Send Purchase Request', 'Select Payment Method')
        print("✅ Updated line 1253: Send Purchase Request → Select Payment Method")
    
    # Write back
    with open('components/stock/ModernBuyerFocusedProductDetail.tsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print("✅ File updated successfully!")
    print("\nVerify the changes:")
    print(f"Line 1252: {lines[1251]}")
    print(f"Line 1253: {lines[1252]}")
else:
    print("❌ File doesn't have enough lines")
