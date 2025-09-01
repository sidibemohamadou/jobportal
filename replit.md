# replit.md

## Overview

This is a multilingual recruitment and candidate management platform built for the first phase of a job application system. The application allows candidates to browse job listings, submit applications with document uploads, and track their application status. The platform supports French, English, and Portuguese interfaces and focuses on providing a streamlined experience for both job seekers and HR personnel.

The system is designed around a full-stack TypeScript architecture with React frontend and Express backend, utilizing modern web technologies for a responsive and scalable recruitment solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture:

- **UI Framework**: Utilizes shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Internationalization**: Custom i18n system supporting French, English, and Portuguese

### Backend Architecture
The server-side follows a RESTful API pattern with Express.js:

- **Framework**: Express.js with TypeScript for type safety
- **Authentication**: Replit Authentication with OpenID Connect integration
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **File Storage**: Google Cloud Storage integration with custom ACL system
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

### Data Layer
The application uses a hybrid storage approach:

- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Well-defined tables for users, jobs, applications, and sessions
- **Storage Strategy**: In-memory storage for development with database fallback for production
- **Data Validation**: Zod schemas shared between frontend and backend for consistency

### File Management System
Custom object storage service with ACL-based permissions:

- **Storage Backend**: Google Cloud Storage with Replit sidecar integration
- **Upload Strategy**: Uppy.js for frontend file uploads with dashboard interface
- **Access Control**: Custom ACL system with group-based permissions
- **File Types**: Support for CV, cover letters, and other application documents

### Authentication & Authorization
Replit-based authentication with role-based access:

- **Identity Provider**: Replit OpenID Connect
- **Session Strategy**: Server-side sessions stored in PostgreSQL
- **User Management**: Automatic user creation/update from OAuth claims
- **Access Control**: Route-level authentication middleware

### Development & Build Process
Modern development toolchain with hot reloading:

- **Build Tool**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement with error overlay
- **Production**: ESBuild bundling for server code, Vite for client assets
- **Type Checking**: Strict TypeScript configuration across all layers

## External Dependencies

### Cloud Services
- **Replit Authentication**: OpenID Connect provider for user authentication
- **Google Cloud Storage**: Object storage for file uploads and document management
- **Neon Database**: PostgreSQL database hosting (configured via DATABASE_URL)

### Core Libraries
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **State Management**: TanStack Query for server state and caching
- **Form Handling**: React Hook Form with Hookform Resolvers for validation
- **Schema Validation**: Zod for runtime type checking and form validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Uploads**: Uppy ecosystem (core, dashboard, AWS S3 plugin)

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Experience**: Replit plugins for cartographer and runtime error handling