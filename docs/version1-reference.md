# ChromaLink - Version 1 Reference (Database-Driven Architecture)

## Infrastructure Setup

### 1. Version Control
- Initialize GitHub repository
- Set up branch protection rules
- Configure GitHub Actions for CI/CD

### 2. Database Schema (Supabase)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR,
  email VARCHAR UNIQUE,
  selected_color VARCHAR,
  original_photo_url TEXT,
  processed_image_url TEXT,
  ai_creative_response TEXT,
  session_complete BOOLEAN DEFAULT FALSE
);
```

### 3. Storage Setup
- Configure Supabase Storage buckets:
  - original-photos/
  - processed-images/

### 4. External Services
- Set up OpenAI API account and secure API keys
- Deploy ComfyUI to cloud (separate service)
- Configure email service (SendGrid/Resend.com)

## Application Architecture

### 1. Frontend Structure
```
src/
├── components/
│   ├── Camera/
│   ├── OrbAnimation/
│   ├── ColorSelection/
│   ├── ResultCard/
│   └── Layout/
├── pages/
│   ├── Home/
│   ├── PhotoCapture/
│   ├── ColorQuestion/
│   ├── Processing/
│   ├── UserInfo/
│   └── Result/
├── hooks/
│   ├── useCamera
│   ├── useStorage
│   └── useDatabase
└── services/
    ├── supabase
    ├── comfyui
    └── openai
```

### 2. Page-by-Page Implementation

#### Homepage
- Minimal, dark theme implementation
- Animated entrance for title and CTA
- Route setup with Next.js

#### Photo Capture
- Custom camera hook with device detection
- Orb animation component
- Image compression before upload
- Progress tracking

#### Color Selection
- Interactive orb buttons with glow effects
- State management for selection
- Validation before proceeding

#### Processing
- Background processing system
- WebSocket connection for real-time updates
- Error handling and retry logic

#### User Info Collection
- Form validation
- Email format verification
- GDPR compliance considerations

#### Result Display
- Card design system
- Image optimization
- Email template system
- Social sharing capabilities

## API Integration Points

### 1. ComfyUI Integration
```typescript
interface ComfyUIRequest {
  originalImage: string;
  selectedColor: string;
  prompt: string;
}
```

### 2. OpenAI Integration
```typescript
interface OpenAIRequest {
  selectedColor: string;
  context: string;
}
```

## Development Phases

### Phase 1: Core Infrastructure
- Repository setup
- Database implementation
- Storage configuration
- Basic routing

### Phase 2: Frontend Foundation
- Component development
- Page layouts
- Animation system
- Theme implementation

### Phase 3: Integration
- API connections
- Image processing
- Email system
- Database operations

### Phase 4: Polish
- Performance optimization
- Error handling
- Loading states
- Analytics integration

### Phase 5: Testing & Deployment
- End-to-end testing
- Performance testing
- Security audit
- Production deployment
