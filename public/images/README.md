# NCC ERP - Images & Logos Setup

## Directory Structure
```
public/images/
├── logos/
│   ├── ncc-logo.png          # Official NCC Logo
│   ├── digital-india-logo.png # Official Digital India Logo
│   └── emblem-india.png      # Government of India Emblem
└── backgrounds/
    ├── ncc-cadets-1.jpg      # NCC Cadets Training/Parade
    ├── ncc-cadets-2.jpg      # NCC Cadets in Formation
    ├── ncc-flag.jpg          # NCC Flag Background
    └── parade-ground.jpg     # Parade Ground/Training Ground
```

## Logo Requirements

### NCC Logo
- **File**: `logos/ncc-logo.png`
- **Size**: 512x512px or higher
- **Format**: PNG with transparency
- **Description**: Official National Cadet Corps emblem

### Digital India Logo  
- **File**: `logos/digital-india-logo.png`
- **Size**: 512x512px or higher
- **Format**: PNG with transparency
- **Description**: Official Digital India initiative logo

### Government of India Emblem
- **File**: `logos/emblem-india.png`
- **Size**: 512x512px or higher
- **Format**: PNG with transparency
- **Description**: National Emblem of India (optional)

## Background Images Requirements

### NCC Cadets Photos
- **Files**: `backgrounds/ncc-cadets-*.jpg`
- **Size**: 1920x1080px or higher
- **Format**: JPG/PNG
- **Description**: High-quality photos of NCC cadets in training, parades, or formations
- **Style**: Professional, inspiring, showing discipline and unity

## Usage in Code

Once you add the images, update the Login component:

```tsx
// Replace the current background with actual images
<div 
  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.7), rgba(21, 94, 117, 0.7)), url('/images/backgrounds/ncc-cadets-1.jpg')`
  }}
></div>

// Replace the logo placeholders
<img src="/images/logos/ncc-logo.png" alt="NCC Logo" className="w-8 h-8" />
<img src="/images/logos/digital-india-logo.png" alt="Digital India" className="w-8 h-8" />
```

## Notes
- Ensure all images are optimized for web (compressed but high quality)
- Use official logos only with proper authorization
- Background images should convey professionalism and NCC values
- All images should be in public domain or properly licensed