# ChromaLink - Version 2 Reference (Sessionless Architecture)

## Overview
A lightweight, sessionless implementation of ChromaLink that operates without a persistent database, using client-side state management and temporary storage solutions.

## Technical Stack

### Core Technologies
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Cloudinary (Image Storage)
- OpenAI API
- ComfyUI API
- Resend (Email Service)

## Project Structure
```
chromalink-being/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Home)
│   │   ├── capture/
│   │   ├── color-select/
│   │   ├── processing/
│   │   └── result/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── Camera.tsx
│   │   ├── ColorOrb.tsx
│   │   ├── ProcessingOrb.tsx
│   │   └── ResultCard.tsx
│   ├── store/
│   │   └── session.ts
│   ├── lib/
│   │   ├── cloudinary.ts
│   │   ├── openai.ts
│   │   ├── comfyui.ts
│   │   └── email.ts
│   └── types/
│       └── index.ts
├── public/
├── docs/
└── config/
```

## State Management

### Session Store Interface
```typescript
interface SessionState {
  sessionId: string;
  step: 'initial' | 'capture' | 'color' | 'processing' | 'result';
  capturedPhoto: string | null;
  selectedColor: string | null;
  processedImageUrl: string | null;
  aiResponse: string | null;
  userEmail: string | null;
  isProcessing: boolean;
  error: string | null;
}
```

## Implementation Plan

### 1. Project Setup
```bash
# Initialize Next.js project with TypeScript
npx create-next-app@latest chromalink-being --typescript --tailwind --app --src-dir

# Install dependencies
npm install zustand @cloudinary/url-gen resend openai @react-webcam/webcam
```

### 2. Environment Configuration
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
OPENAI_API_KEY=
COMFYUI_API_ENDPOINT=
RESEND_API_KEY=
```

### 3. Page-by-Page Implementation

#### Homepage (/)
- Black background, white text design
- ChromaLink title animation
- "Find Out" CTA button
- Session initialization

#### Photo Capture (/capture)
- Webcam integration
- 30-second countdown animation
- Photo compression
- Direct upload to Cloudinary
- Error handling for device permissions

#### Color Selection (/color-select)
- Interactive color orbs (red, cyan, blue, white)
- Hover and selection animations
- Progress indication
- Navigation controls

#### Processing (/processing)
- Oracle animation
- Background API calls:
  1. ComfyUI image processing
  2. OpenAI creative response
- Progress indicators
- Error handling

#### Result (/result)
- Magic card-style result display
- Email collection form
- Result delivery
- Share options

### 4. API Integration

#### Cloudinary Setup
```typescript
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}
```

#### ComfyUI Integration
```typescript
interface ComfyUIRequest {
  image: string;
  color: string;
}
```

#### OpenAI Integration
```typescript
interface OpenAIPrompt {
  color: string;
  context: string;
}
```

### 5. Development Phases

#### Phase 1: Core Setup (1-2 days)
- Project initialization
- Environment setup
- Basic routing
- State management implementation

#### Phase 2: UI Components (2-3 days)
- Camera component
- Orb animations
- Color selection interface
- Result card design

#### Phase 3: API Integration (2-3 days)
- Cloudinary setup
- ComfyUI connection
- OpenAI implementation
- Email service configuration

#### Phase 4: Flow Implementation (2-3 days)
- Page transitions
- State persistence
- Error handling
- Loading states

#### Phase 5: Polish & Deploy (1-2 days)
- Animation refinement
- Performance optimization
- Deployment setup
- Testing & bug fixes

## Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables
3. Deploy application

### Post-Deployment
- Set up monitoring
- Configure error tracking
- Implement analytics

## Testing & Quality Assurance

### Key Test Areas
- Photo capture across devices
- State persistence
- API integration reliability
- Email delivery
- Cross-browser compatibility

## Security Considerations
- Implement rate limiting
- Secure API key storage
- Image upload validation
- Email validation
- GDPR compliance for temporary data


# In the beginning we setup:
Let me explain what we've just set up:

Environment Variables (.env.example):
Template for all the API keys and configuration we'll need
You'll need to create a .env.local file with your actual values when ready
Config (src/config/index.ts):
Central place for all configuration values
Type-safe access to environment variables
Easy to maintain and update
Zustand Store (src/store/session.ts):
Manages the entire user session state
Persists data in browser storage
Handles all user flow steps
Includes error handling
Provides type safety with TypeScript
The Zustand store we created will:

Generate a unique session ID for each visit
Track which step the user is on
Store temporary data (photo, color choice, etc.)
Persist data in browser storage (so refreshing doesn't lose progress)
Provide easy methods to update state
Handle loading and error states
