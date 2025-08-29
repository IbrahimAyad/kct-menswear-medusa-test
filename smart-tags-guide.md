# 🏷️ KCT Menswear Smart Tags Guide
## Optimized Tags for AI Filtering System

Based on analysis of the smart-filter-engine.ts, these tags will maximize your product discoverability and AI scoring.

## 🎯 Essential Tag Categories

### 1. **Color Tags** (Primary Importance)
The system heavily weighs color matching. Use specific color names:
```
Primary Colors:
- black
- navy
- grey (not "gray")
- blue
- brown
- white
- burgundy
- red
- green

Extended Palette:
- charcoal
- royal-blue
- light-grey
- midnight-blue
- forest-green
- emerald
- coral
- blush
- dusty-rose
- gold
- silver
- ivory
- cream
- tan
- sand
- chocolate-brown
```

### 2. **Category Tags** (Critical for Filtering)
Use these exact category names for best results:
```
Main Categories:
- suit
- shirt
- tie
- blazer
- vest
- pants
- jacket
- accessories

Specific Types:
- tuxedo
- dress-shirt
- bow-tie
- suspenders
- pocket-square
- cufflinks
- belt
- shoes
```

### 3. **Occasion Tags** (Boost Relevance)
The system uses these for outfit suggestions:
```
Formal Events:
- wedding
- prom
- gala
- black-tie
- formal
- business
- professional
- interview

Casual/Semi-Formal:
- casual
- smart-casual
- date-night
- cocktail
- party
- graduation
- homecoming
```

### 4. **Style Profile Tags** (AI Scoring)
These directly match user preferences:
```
Style Keywords:
- classic
- traditional
- timeless
- modern
- contemporary
- sleek
- trendy
- fashion
- latest
- casual
- relaxed
- comfortable
- formal
- professional
```

### 5. **Seasonal Tags** (Time-Based Relevance)
System checks these against current season:
```
Seasonal Keywords:
Spring:
- light
- pastel
- cotton
- linen
- spring

Summer:
- lightweight
- breathable
- short-sleeve
- tropical
- summer

Fall:
- wool
- tweed
- earth-tone
- fall
- autumn

Winter:
- heavy
- warm
- cashmere
- velvet
- winter
```

### 6. **Material/Fabric Tags**
Help with texture and quality matching:
```
Premium Materials:
- wool
- cashmere
- silk
- velvet
- satin
- italian-wool
- egyptian-cotton

Standard Materials:
- cotton
- polyester
- blend
- stretch
- wrinkle-free
- microfiber
```

### 7. **Fit Type Tags**
Important for size/fit preferences:
```
Fit Styles:
- slim-fit
- classic-fit
- modern-fit
- athletic-fit
- relaxed-fit
- tailored
- regular-fit
```

### 8. **Special Feature Tags**
Boost product visibility:
```
Features:
- trending (automatically boosts AI score by 10)
- new-arrival
- best-seller
- limited-edition
- exclusive
- sale
- bundle (gets value score boost)
- premium
- luxury
```

### 9. **Pattern/Design Tags**
For visual style matching:
```
Patterns:
- solid
- striped
- plaid
- check
- paisley
- floral
- geometric
- textured
- sparkle
- glitter
- rhinestone
```

### 10. **Price Range Tags**
System categorizes as:
```
Price Categories:
- budget (under $150)
- mid-range ($150-$300)
- premium ($300-$500)
- luxury (over $500)
```

## 📊 Optimal Tag Structure

### Example Product with Optimized Tags:

```javascript
{
  name: "Navy Blue Three-Piece Suit",
  tags: [
    // Colors (2-3 tags)
    "navy",
    "blue",
    
    // Category (2-3 tags)
    "suit",
    "three-piece",
    "formal",
    
    // Occasion (2-4 tags)
    "wedding",
    "business",
    "professional",
    "black-tie",
    
    // Style (2-3 tags)
    "classic",
    "timeless",
    "traditional",
    
    // Season (1-2 tags)
    "all-season",
    "wool",
    
    // Fit (1 tag)
    "modern-fit",
    
    // Features (1-2 tags)
    "best-seller",
    "premium"
  ]
}
```

## 🚀 AI Scoring Boosters

Tags that directly increase AI scores:
1. **"trending"** - +10 points
2. **"bundle"** - Better value score
3. **Seasonal match** - +10 points (automatic)
4. **Color match to query** - +20 points
5. **User preference match** - +15 points

## ⚡ Quick Implementation Guide

### For Suits:
```
tags: ["color", "suit", "two-piece/three-piece", "formal", "wedding", "business", "classic/modern", "wool/cotton", "fit-type"]
```

### For Shirts:
```
tags: ["color", "shirt", "dress-shirt", "cotton/silk", "formal/casual", "classic-fit/slim-fit", "wrinkle-free"]
```

### For Ties:
```
tags: ["color", "tie", "silk", "pattern", "width", "formal", "wedding", "classic/trendy"]
```

### For Bundles:
```
tags: ["bundle", "value", "complete-outfit", "wedding-package", "prom-package", colors, occasions]
```

## 🎨 Color Combination Tags

For products with multiple colors:
```
Primary + Secondary:
- "navy-white"
- "black-gold"
- "burgundy-navy"
- "grey-blue"
```

## 📈 Search Optimization Tips

1. **Use lowercase** for all tags (system converts to lowercase)
2. **Be specific** - "royal-blue" better than just "blue"
3. **Include variations** - "tux", "tuxedo", "formal-suit"
4. **Add trending items** - Mark hot sellers with "trending"
5. **Season-specific** - Add current season tags for boost
6. **Bundle advantage** - Always tag bundles with "bundle" and "value"

## 🔍 Search Query Matching

The system searches in:
1. Product name
2. Description
3. Category
4. All tags

So distribute keywords across these fields for best coverage.

## 💡 Pro Tips

1. **Minimum Tags**: 8-10 per product
2. **Maximum Tags**: 15-20 per product
3. **Color First**: Always include color tags
4. **Occasion Second**: Match to customer use cases
5. **Style Third**: Help with preference matching
6. **Update Seasonal**: Rotate seasonal tags quarterly
7. **Track Performance**: Monitor which tags drive sales

## 🏆 Top Performing Tag Combinations

Based on the AI scoring system:
1. `["navy", "suit", "wedding", "classic", "trending", "wool", "formal"]`
2. `["black", "tuxedo", "prom", "modern", "new-arrival", "premium"]`
3. `["bundle", "complete-outfit", "wedding", "value", "best-seller"]`
4. `["burgundy", "blazer", "sparkle", "prom", "trending", "exclusive"]`
5. `["white", "dress-shirt", "cotton", "classic", "formal", "wrinkle-free"]`

## 📊 Tag Performance Metrics

Monitor these for optimization:
- **Click-through rate** by tag
- **Conversion rate** by tag combination
- **Search frequency** for each tag
- **AI score average** by tag group

Remember: The AI system gives more weight to exact matches, so use precise, consistent terminology across all products.