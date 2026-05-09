# Image Upload Debug Guide - AutoGenerateCombos

## Issue
Images uploaded through AutoGenerateCombos are not being saved to Firestore with the stock items.

## Debugging Added

I've added comprehensive console logging throughout the entire image upload and save flow. Here's what to look for:

---

## Flow Tracking

### 1. **AutoGenerateCombos - Image Upload** (in browser console)

When you upload an image for a variant combo:

```
✅ Image uploaded: {
  comboId: "COMBO-001",
  variantId: "Red-M",
  url: "https://firebasestorage.googleapis.com/...",
  size: "245.32 KB"
}
```

**What to check:**
- Is the image successfully uploaded to Firebase Storage?
- Is the URL a valid Firebase Storage URL?

---

### 2. **AutoGenerateCombos - Apply Combos** (when clicking "Add Pricing Details")

```
🎯 [COMBOS] Starting to apply combos...
🖼️ [COMBOS] Current edited images state: {
  "COMBO-001": "https://firebasestorage.googleapis.com/...",
  "COMBO-002": "https://firebasestorage.googleapis.com/..."
}
⭐ [COMBOS] Main image combo ID: COMBO-001
```

**What to check:**
- Are the images present in `editedImages` state?
- Is the main image ID set correctly?

---

### 3. **AutoGenerateCombos - Processing Each Combo**

For each variant combo:

```
📦 [COMBOS] Processing combo Red-M: {
  comboId: "COMBO-001",
  quantity: 50,
  basePrice: 0,
  hasImage: true,
  imageUrl: "https://firebasestorage.googleapis.com/...",
  isMainImage: true
}
```

**What to check:**
- Does `hasImage` show `true`?
- Is `imageUrl` populated with the Firebase Storage URL?
- Which combo is marked as `isMainImage`?

---

### 4. **AutoGenerateCombos - Final Combos Summary**

```
✅ [COMBOS] Final combos prepared: {
  totalCombos: 6,
  combosWithImages: 3,
  allImages: [
    { color: "Red", size: "M", hasImage: true, imageUrl: "https://..." },
    { color: "Blue", size: "L", hasImage: true, imageUrl: "https://..." },
    { color: "Green", size: "XL", hasImage: false, imageUrl: undefined }
  ]
}
```

**What to check:**
- Does `combosWithImages` match the number of images you uploaded?
- Are all image URLs valid Firebase Storage URLs?
- Are any images unexpectedly missing?

---

### 5. **AddStockWizard - Variants Received**

After combos are applied, check the wizard's variant processing:

```
📦 [PUBLISH] Variants processed: {
  totalVariants: 6,
  basePrice: 0,
  totalQuantity: 300,
  variantsWithImages: 3,
  sampleVariant: { ... }
}
🖼️ [PUBLISH] Checking variant images:
  ✅ Variant 0: Red-M { imageUrl: "https://...", images: ["https://..."], mainImage: true }
  ✅ Variant 1: Blue-L { imageUrl: "https://...", images: ["https://..."], mainImage: false }
```

**What to check:**
- Does `variantsWithImages` match your uploaded images count?
- Are variant images showing up in the list?
- Is the `imageUrl` field populated?

---

### 6. **AddStockWizard - Final Document Preparation**

Before saving to Firestore:

```
💾 [PUBLISH] Stock item prepared: {
  name: "Premium Cotton T-Shirts",
  category: "Apparel",
  variants: 6,
  variantsWithImages: 3,
  productImages: 3,
  quantity: 300,
  sampleVariantWithImage: { ... }
}
```

**What to check:**
- Does `variantsWithImages` count match?
- Does `productImages` count show images?

---

### 7. **AddStockWizard - Firestore Document**

The actual document being sent to Firestore:

```
📝 [PUBLISH] Document to add: { ... }
🖼️ [PUBLISH] Variant images in document: {
  totalVariants: 6,
  variantsWithImageUrl: [
    { color: "Red", size: "M", imageUrl: "https://..." },
    { color: "Blue", size: "L", imageUrl: "https://..." }
  ],
  variantsWithImagesArray: [
    { color: "Red", size: "M", images: ["https://..."] },
    { color: "Blue", size: "L", images: ["https://..."] }
  ]
}
📄 [PUBLISH] Document added with ID: abc123xyz
```

**What to check:**
- Are images present in both `variantsWithImageUrl` AND `variantsWithImagesArray`?
- Are the image URLs valid Firebase Storage URLs?
- Was the document successfully saved (check the ID)?

---

## Common Issues & Solutions

### Issue 1: Images Not Uploading to Firebase Storage

**Symptoms:**
- No "✅ Image uploaded" message
- Error messages about Firebase Storage

**Check:**
1. Is Firebase Storage configured?
2. Are you authenticated?
3. Check browser console for upload errors

**Solution:** Verify Firebase Storage setup in `/utils/firebase/storage.ts`

---

### Issue 2: Images Lost When Applying Combos

**Symptoms:**
- Images upload successfully
- But `🖼️ [COMBOS] Current edited images state` shows empty object

**Check:**
- Look at the `applyCombos` function logs
- Verify `editedImages` state is populated

**Solution:** This indicates a state management issue in AutoGenerateCombos

---

### Issue 3: Images Not in Final Variants

**Symptoms:**
- AutoGenerateCombos shows images correctly
- But AddStockWizard shows `variantsWithImages: 0`

**Check:**
- Compare the combo data structure with variant data structure
- Verify `imageUrl` and `images` fields are being passed

**Solution:** Check the mapping between combo format and variant format

---

### Issue 4: Images Not Saved to Firestore

**Symptoms:**
- All previous logs show images correctly
- But after refresh, images are missing

**Check:**
1. Look at `📝 [PUBLISH] Document to add` - are images there?
2. Check `🖼️ [PUBLISH] Variant images in document` - any images listed?
3. Verify document was saved: `📄 [PUBLISH] Document added with ID`

**Solution:** If images are in the document but not appearing after refresh, check Firestore directly

---

## How to Debug

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Clear console** before starting
3. **Upload images** to your variant combos
4. **Click "Add Pricing Details"**
5. **Complete the wizard** and click "Publish Product"
6. **Copy all console output** with the emoji markers
7. **Follow the flow** to identify where images are lost

---

## Expected Complete Flow

If everything works correctly, you should see:

1. ✅ Images uploaded to Firebase Storage
2. 🎯 Images present in `editedImages` state
3. 📦 Each combo processed with `hasImage: true`
4. ✅ Final combos showing correct image count
5. 📦 Variants showing images in wizard
6. 💾 Stock item showing images in preparation
7. 📝 Document showing images in variant data
8. 📄 Document successfully saved to Firestore

---

## Quick Checklist

- [ ] Firebase Storage is configured
- [ ] Images upload to Firebase Storage successfully
- [ ] Images show in AutoGenerateCombos preview
- [ ] `editedImages` state populated correctly
- [ ] Combos applied with images
- [ ] Variants in wizard have images
- [ ] Final document has variant images
- [ ] Document saved to Firestore
- [ ] Images appear after page refresh

---

## Next Steps

1. Try uploading a product with images
2. Check console logs at each step
3. Identify where images are lost
4. Share the console output if you need help debugging
