# 📦 Box

> **Ephemeral storage for notes, links, and images across devices**

Box is a modern web application that provides temporary, shareable storage for your notes, links, and images. Perfect for quickly sharing content across devices or with others without permanent storage concerns.

Also I hated that I have to login to everything so each box can be password protected, so no need to create an account and then manage user sessions and all that. This way also opens it up for me to check my **Box** on any platform (security be dammed, tried making it secure read implementation of Edge functions).

## ✨ Features

- 🔗 **Quick Link Sharing** - Share URLs instantly across devices
- 📝 **Text Notes** - Store and share text content temporarily  
- 🖼️ **Image Upload** - Upload and share images with automatic cleanup
- 📄 **File Attachments (PDF, CSV, etc.)** - Upload and share non-image files via `FileContent`
- 🔐 **JWT Token Auth for Boxes** - After first successful password entry, an HttpOnly JWT cookie is set so you don't need to re-enter the password every time
- ⏰ **Auto Cleanup** - Content automatically expires after 24 hours
- 🎨 **Modern UI** - Beautiful, responsive design with dark/light mode

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (Database + Storage + Edge Functions)
- **Styling**: Tailwind CSS 4, Radix UI components
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm
- Supabase account or Supabase CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:saifuddm/box.git
   cd box
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project 
   - Run the migrations in `supabase/migrations/`
   - Set up the storage bucket for `image-content`
 - OR 
   - `npx supabase start` for local

4. **Environment Variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BOX_TOKEN_SECRET=your_random_long_secret
   ```
   - Also set `BOX_TOKEN_SECRET` for your Supabase Edge Functions environment (used by token verification).

5. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.


## 🗄️ Database Schema

The application uses three main tables and one view:
- `Box` - Container for all content with auto-expiry
- `TextContent` - Text notes and links
- `ImageContent` - Uploaded images with storage references
- `FileContent` - Uploaded files (e.g., PDF, CSV) with storage references
- `PublicBox` (View) - View of `Box` but without the password_hash column

## 🔧 Edge Functions

- **box-cleanup** - Automatically removes expired boxes and associated files every 24 hours
- **create-box** - Creates a box and if a password is given the edge function will hash it.
- **box-auth** - Validates a box's password (if protected). Used by the Next.js API route to issue a short-lived JWT and set it as an HttpOnly cookie.
- **get-box-content** - Returns content for a box after verifying a short‑lived JWT (or password during initial auth). Supports `TextContent`, `ImageContent`, and `FileContent`.
- **get-storage-content** - Get the images from the main bucket, (should also have the same protections as `get-box-content` but I got lazy)
- **upload-content** - Uploads images and files, creating entries in `ImageContent` or `FileContent` as appropriate.




## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [Shadcn](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)