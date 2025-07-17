# 360 Feedback Platform

## Overview

This is a full-stack 360 feedback platform built with React and Express.js. The application enables organizations to conduct comprehensive feedback surveys for leaders, allowing anonymous responses from team members and generating detailed reports for organizational development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Development**: Hot module replacement with Vite integration

### Key Components

#### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Organizations**: Multi-tenant support with domain-based organization management
- **Users**: Role-based access control (admin, leader, participant) with organizational affiliation
- **Surveys**: Template-based survey system with JSON question storage
- **Survey Cycles**: Individual survey instances for specific leaders
- **Survey Invitations**: Anonymous invitation system with unique codes
- **Survey Responses**: Anonymous response collection with hashed participant identification

#### Authentication & Authorization
- JWT token-based authentication stored in localStorage
- Role-based access control with middleware enforcement
- Secure password hashing using bcrypt
- Anonymous response system for privacy protection

#### User Interface
- Responsive design with mobile-first approach
- Component-driven architecture using shadcn/ui
- Dark/light mode support through CSS custom properties
- Material design-inspired shadows and interactions
- Comprehensive form handling with react-hook-form

## Data Flow

1. **User Authentication**: Users log in through JWT authentication, with tokens stored client-side
2. **Survey Creation**: Admins create survey templates with flexible JSON-based question structures
3. **Survey Cycle Management**: Leaders can initiate survey cycles, generating unique invitation codes
4. **Anonymous Responses**: Participants submit responses using anonymous invitation codes
5. **Report Generation**: System aggregates responses into comprehensive reports for leaders
6. **Administrative Oversight**: Admins can review and approve reports before release

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **bcrypt**: Secure password hashing
- **jsonwebtoken**: JWT authentication implementation
- **wouter**: Lightweight React routing

### UI Dependencies
- **@radix-ui/***: Comprehensive accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **tsx**: TypeScript execution for Node.js

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` using Vite
- Backend builds to `dist` using esbuild with ESM output
- Static assets served from Express in production

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration for authentication
- Production/development environment detection

### Development Workflow
- Hot module replacement for frontend development
- TypeScript compilation checking
- Database schema migrations using Drizzle Kit
- Integrated development server with API proxying

### Production Considerations
- Serverless-ready architecture with Neon Database
- Static asset optimization and caching
- Environment-based configuration management
- Error handling and logging middleware

The application is designed for scalable deployment with support for multiple organizations, comprehensive privacy controls, and enterprise-grade security features.

## Test Accounts

The system has been seeded with test data and accounts for immediate use:

**Admin Account:**
- Email: admin@demo.com
- Password: admin123
- Role: Administrator (full access to all features)

**Leader Account:**
- Email: leader@demo.com  
- Password: leader123
- Role: Leader (can create surveys and view own reports)

## SyncShift 360 Survey Integration

The platform includes a complete SyncShift 360 feedback survey based on the provided questionnaire and competency framework:

- **26 Rating Questions** (1-7 scale) across 6 key competency areas:
  - 🌀 Leadership (Direction & Sense-Making) - 5 questions
  - 🏗️ Infrastructure (Systems & Delivery) - 4 questions  
  - 🔍 Motives (Purpose & Authenticity) - 4 questions
  - ⚡ Capabilities (Skills & Agility) - 4 questions
  - 🤝 Culture (Team & Norms) - 4 questions
  - 🌟 Personal Brand (Impact & Reputation) - 3 questions
  - 🗝️ Alignment (Outcome) - 2 questions

- **3 Open Text Questions** for qualitative feedback:
  - Greatest strengths
  - Areas for small shifts to create better alignment
  - Additional feedback

The survey maintains GDPR compliance with anonymous response collection and secure data handling throughout the feedback process.

## Recent Changes (January 2025)

- **Fixed invitation system**: Added proper error handling and logging for survey invitation creation
- **Enhanced survey display**: Shows leader's name and position prominently on survey pages
- **Corrected question count**: Now displays all 29 questions (26 rating + 3 open text) with 7-point rating scale
- **Clarified survey access**: Survey codes serve as backup access when direct links aren't available
- **Improved UI**: Added category labels and better organization for the 29 SyncShift questions
- **Updated sharing information**: Displays both survey codes and direct links with clear explanations
- **Added public home page**: Created main landing page at "/" with 360 feedback as a menu option
- **Anonymous survey access**: Users can access surveys via "/survey-access" without admin login
- **Reorganized navigation**: Admin functions moved to "/admin" route, public access at root