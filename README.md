# Nexus AI Automation Agency Website

A modern, SEO-optimized website for Nexus AI Automation Agency featuring lead generation forms, ElevenLabs AI voice agents, and comprehensive business automation solutions.

## 🚀 Features

- **SEO/AEO Optimized**: Complete search engine and AI answer engine optimization
- **Lead Generation**: Advanced contact forms with validation and lead capture
- **ElevenLabs Integration**: AI voice agents for enhanced user interaction
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Responsive Design**: Mobile-first approach with excellent UX
- **Performance Optimized**: Fast loading times and Core Web Vitals compliance

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Forms**: React Hook Form with validation
- **SEO**: next-seo with structured data
- **Voice AI**: ElevenLabs API integration
- **Icons**: Heroicons
- **UI Components**: Headless UI

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the `.env.local` file with your actual values:
   - ElevenLabs API key and voice ID
   - Email service configuration
   - Other API keys as needed

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── forms/          # Form components
│   ├── seo/            # SEO components
│   └── ui/             # UI components
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### ElevenLabs Voice Agent Setup

1. Get your ElevenLabs API key from [ElevenLabs](https://elevenlabs.io)
2. Choose a voice ID from your available voices
3. Add them to your `.env.local` file
4. The voice agent component will automatically use these credentials

### SEO Configuration

The project includes comprehensive SEO setup:
- Meta tags optimization
- Open Graph and Twitter Cards
- Structured data (JSON-LD)
- Sitemap generation
- Robot.txt optimization

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms
The project works with any platform supporting Next.js.

---

**Built with ❤️ for Nexus AI Automation Agency**
