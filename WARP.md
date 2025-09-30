# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server on localhost:3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Auto-fix ESLint errors where possible |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check if files need formatting |
| `npm run type-check` | Run TypeScript compiler to check types |
| `npm run clean` | Remove .next and out directories |
| `npm run analyze` | Build with bundle analyzer (requires ANALYZE=true env var) |

## Architecture Overview

This is a **Next.js 15** application using the **App Router** architecture with:

- **React Server Components (RSC)** by default - components are server-rendered unless marked with `'use client'`
- **TypeScript** with strict mode enabled and custom path aliases (`@/*` → `./src/*`)
- **App Router** file-based routing in `src/app/`
- **Tailwind CSS 4** for styling with custom configuration
- **Modern React 19** with concurrent features

### Key Architectural Decisions
- All components are Server Components by default - only add `'use client'` when needed for interactivity
- Client components are clearly marked and handle user interactions, state, and browser APIs
- SEO is handled through next-seo configuration and metadata API
- Environment variables for API integrations (ElevenLabs, email services)

## Tech Stack & Integrations

### Core Framework
- **Next.js 15** with App Router and TypeScript
- **React 19** with Server Components and Suspense
- **Tailwind CSS 4** for utility-first styling

### Key Integrations

#### ElevenLabs Voice AI
- Configuration in `src/lib/elevenlabs.ts`
- Requires `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` environment variables
- Used by VoiceAgent component for text-to-speech functionality
- Supports both streaming and non-streaming audio generation

```typescript
// Usage pattern in lib/elevenlabs.ts
const elevenlabs = new ElevenLabsAPI({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: process.env.ELEVENLABS_VOICE_ID || ''
})
```

#### Framer Motion
- Used for page transitions and micro-interactions
- Applied to form submissions, buttons, and modal animations
- Client-side only - components using it are marked with `'use client'`

#### React Hook Form
- Form validation and submission handling in `LeadCaptureForm.tsx`
- Integrated with TypeScript for type-safe form data
- Handles lead capture with validation and loading states

#### Next-SEO
- Global SEO configuration in `next-seo.config.js`
- Optimized for AI search engines (AEO) and traditional SEO
- Includes structured data, Open Graph, and Twitter Cards

## Component Architecture

```
src/components/
├── forms/           # Form components with validation
│   └── LeadCaptureForm.tsx
├── seo/             # SEO-related components
│   └── SEOHead.tsx
└── ui/              # UI components and layouts
    ├── Footer.tsx
    ├── Header.tsx
    └── VoiceAgent.tsx   # ElevenLabs integration
```

### Component Patterns
- **Server Components**: Default for static content, SEO components, layouts
- **Client Components**: Forms, interactive elements, voice agents (marked with `'use client'`)
- **Form Components**: Use React Hook Form with TypeScript validation
- **Animation Components**: Use Framer Motion for enhanced UX

### UI Component Guidelines
- All interactive components are client components
- Voice agent is a floating component with expand/collapse functionality
- Forms include comprehensive validation and loading states
- SEO components handle metadata and structured data

## Environment Setup

### Required Environment Variables
Create `.env.local` in the project root:

```bash
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# Email Service (if using contact forms)
EMAIL_SERVICE_API_KEY=your_email_service_key
EMAIL_FROM=your_sender_email

# Other API Keys as needed
```

### Development Setup
1. Install dependencies: `npm install`
2. Create `.env.local` with required API keys
3. Start development server: `npm run dev`
4. Visit http://localhost:3000

## File Structure & Patterns

```
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout with fonts
│   │   └── page.tsx      # Home page
│   ├── components/       # React components (organized by function)
│   ├── lib/              # Utility libraries and API integrations
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions (if created)
├── public/              # Static assets (images, icons, etc.)
├── next-seo.config.js   # SEO configuration
├── next.config.ts       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

### Development Patterns
- **Import Paths**: Use `@/` alias for all src imports (`import { Component } from '@/components/ui'`)
- **Component Organization**: Group by function (forms, ui, seo) rather than by type
- **Type Definitions**: Centralized in `src/types/index.ts` for shared interfaces
- **API Integrations**: Separate files in `src/lib/` for each service integration
- **Environment Variables**: Access through `process.env` in server components, pass to client components as props

### Code Quality Tools
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Consistent code formatting across all file types
- **TypeScript**: Strict mode enabled with path mapping
- **Tailwind**: PostCSS integration with CSS4 features

## Key Development Notes

### API Routes (Future)
When implementing API routes, place them in:
- `src/app/api/contact/route.ts` - Lead form submission
- `src/app/api/voice/transcribe/route.ts` - Speech-to-text
- `src/app/api/voice/respond/route.ts` - AI response generation

### Voice Agent Integration
The VoiceAgent component expects API endpoints for:
- `/api/voice/transcribe` - Convert audio to text
- `/api/voice/respond` - Generate AI response and voice audio

### SEO Optimization
- Metadata is handled through Next.js metadata API in layout files
- Global SEO config in `next-seo.config.js`
- Structured data and Open Graph tags are pre-configured
- Focus on AEO (AI Answer Engine Optimization) for modern search

### Performance Considerations
- Server Components are used by default for better performance
- Client components are minimal and focused on interactivity
- Images should use Next.js Image component with optimization
- Lazy loading implemented for non-critical components

## MCP (Model Context Protocol) Servers

This project uses several MCP servers to enhance development capabilities:

### Available MCP Servers

1. **ElevenLabs MCP Server** (`C:\Users\svetk\.mcp-servers\elevenlabs-mcp\`)
   - Text-to-speech conversion
   - Voice synthesis with custom settings
   - Voice management and selection
   - Replaces the custom `src/lib/elevenlabs.ts` integration

2. **Mem0 MCP Server** (`C:\Users\svetk\.mcp-servers\mem0-mcp\`)
   - Persistent memory for WARP sessions
   - Context retention across conversations
   - Project-specific memory storage
   - User-personalized AI assistance

3. **AI Tools Database MCP** (`C:\Users\svetk\.mcp-servers\ai-tools-db-mcp\`)
   - Comprehensive database of AI tools for SMBs
   - Automatic scraping and updates
   - Search and categorization features
   - Business-size filtered recommendations

4. **Official MCP Servers** (`C:\Users\svetk\.mcp-servers\official-servers\`)
   - Filesystem operations
   - Memory management
   - Fetch capabilities
   - Time utilities

### MCP Server Usage

#### ElevenLabs Integration
```bash
# Instead of using src/lib/elevenlabs.ts, use MCP tools:
# - text_to_speech: Convert text to audio
# - get_voices: List available voices
# - stream_text_to_speech: Stream audio generation
```

#### Memory Management with Mem0
```bash
# Store development context:
# - add_memory: Save project decisions, patterns, preferences
# - search_memory: Find relevant past context
# - get_all_memories: Review all stored information
```

#### AI Tools Research
```bash
# Find tools for client projects:
# - search_ai_tools: Search by functionality or category
# - get_tool_categories: Browse available categories
# - trigger_scraping: Update database with latest tools
```

### Configuration

MCP servers are configured in `C:\Users\svetk\.mcp-servers\mcp-client-config.json`.

Required environment variables:
- `ELEVENLABS_API_KEY`: ElevenLabs API key
- `ELEVENLABS_VOICE_ID`: Default voice ID
- `MEM0_API_KEY`: Mem0 service key
- `OPENAI_API_KEY`: OpenAI key for Mem0 embeddings

### Unicorn Studios Animation Integration

For hero section animations created in Unicorn Studios:

1. **Export Format**: Lottie JSON (recommended) or MP4/WebM
2. **Location**: Place in `src/animations/` or `public/animations/`
3. **Component**: Use `HeroAnimation` or `VideoHero` components
4. **Integration**: Combines with Framer Motion for enhanced UX

See `C:\Users\svetk\.mcp-servers\unicorn-studios-integration.md` for detailed workflow.

### Development Workflow with MCP

1. **Voice Features**: Use ElevenLabs MCP instead of custom integration
2. **Context Retention**: Store important decisions in Mem0 memory
3. **Tool Research**: Query AI tools database for client recommendations
4. **Animation**: Process Unicorn Studios exports for web optimization
