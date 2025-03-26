# BetterFlare

A modern, intuitive manager for Cloudflare R2 storage

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## What is BetterFlare?

BetterFlare is an open-source web application that provides a clean, intuitive interface for managing your Cloudflare R2 storage buckets. Unlike the default Cloudflare dashboard, BetterFlare focuses specifically on R2 management with a streamlined UI that makes working with your cloud storage faster and more efficient.

Built with Next.js and tRPC, BetterFlare offers a responsive, Vercel-inspired design that prioritizes usability while maintaining robust functionality for developers and teams who need to manage their R2 storage effectively.

## Features

- **Client-side Credentials**: Your Cloudflare API credentials stay in your browser's local storage and are never sent to any external servers
- **Bucket Management**: View, navigate, and manage all your R2 buckets in one place
- **Object Operations**: Upload, download, rename, and delete objects with ease
- **Folder Navigation**: Intuitive breadcrumb navigation for nested folders
- **Modern UI**: Clean, responsive interface inspired by Vercel's design principles
- **Fast Performance**: Optimized with route prefetching and intelligent caching for snappy navigation
- **Real-time Feedback**: Visual indicators for loading states and operations
- **Fully TypeScript**: End-to-end type safety from frontend to API

## Screenshots

*Coming soon*

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cloudflare account with R2 enabled
- Your Cloudflare Account ID, Access Key ID, and Secret Access Key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/betterflare.git
cd betterflare
```

2. Install dependencies:

```bash
# Using npm
npm install

# Using Bun (recommended)
bun install
```

3. Start the development server:

```bash
# Using npm
npm run dev

# Using Bun
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Authentication

1. On the home page, enter your Cloudflare credentials:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - (Optional) Custom endpoint

2. Your credentials are stored securely in your browser's local storage and are never sent to any external servers.

### Managing Buckets

- The dashboard displays all your R2 buckets in a clean, card-based layout
- Click on any bucket to view its contents
- Use the sidebar for quick navigation between buckets

### Working with Objects

- Navigate through folders using the breadcrumb navigation
- Upload files using the upload button
- Download, rename, or delete objects using the action buttons
- View object details including size and last modified date

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **API Layer**: [tRPC](https://trpc.io/) for type-safe API calls
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide](https://lucide.dev/)
- **Cloud Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **AWS SDK**: AWS S3 SDK for R2 compatibility

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or code contributions, we appreciate all help in making BetterFlare better.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the code style of the project.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments

- [Cloudflare](https://www.cloudflare.com/) for their amazing R2 service
- [Vercel](https://vercel.com/) for design inspiration
- [shadcn](https://twitter.com/shadcn) for the excellent UI components

---

Built with ❤️ by ZEIT
