#!/usr/bin/env python3
"""
Debug script to find exact characters in the file around line 1080-1140
"""

with open('/components/stock/ModernBuyerFocusedProductDetail.tsx', 'rb') as f:
    lines = f.readlines()
    
print("=== Lines 1077-1083 (raw bytes) ===")
for i in range(1076, 1083):
    print(f"Line {i+1}:")
    print(f"  Bytes: {lines[i]}")
    print(f"  Text: {lines[i].decode('utf-8')}")
    print()

print("\n=== Lines 1134-1136 (raw bytes) ===")    
for i in range(1133, 1136):
    print(f"Line {i+1}:")
    print(f"  Bytes: {lines[i]}")
    print(f"  Text: {lines[i].decode('utf-8')}")
    print()
