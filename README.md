# 🏢 Hostel Manager 

[![Next.js](https://img.shields.io/badge/Next.js-16.3%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4%2B-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR%20%26%20RLS-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**Hostel Manager** is a next-generation, high-performance campus residence management platform designed for universities, colleges, and private student housing hubs. Built with **Next.js 16+ App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase SSR**, it provides real-time synchronization between student mobile apps, warden control panels, and administrative desks.

---

## Live Link : https://hostel-manager-seven.vercel.app/

## 🌟 Key Features & Core Modules

### 🏢 1. Hostel & Room Inventory Management
- **Multi-Block Configuration**: Manage multiple hostel blocks (*Aryabhata Tower*, *Gargi Residence Hall*, *Kalam Research Hostel*, *Turing International House*).
- **Floor Maps & Room Types**: Visual management for single, double, triple, and dormitory rooms with capacity indicators.
- **Dynamic Pricing**: Room rates and maintenance estimates configured in Indian Rupees (`₹`).

### 🔑 2. Digital Gate Pass & Leave Engine
- **Out-of-Campus Leave Requests**: Students can apply for day passes or overnight home leaves.
- **Warden Approvals**: Multi-level warden approval workflow with status tracking (*Pending*, *Approved*, *Rejected*).
- **QR Gate Verification**: Instant identity and gate pass verification for campus security guards.

### 🚰 3. Maintenance Dispatch System
- **Comprehensive Issue Reporting**: Report issues across **Plumbing**, **Electrical**, **Wi-Fi**, **Carpentry**, **Appliances**, **Pest Control**, and **Security**.
- **Urgency Tagging**: Low, Medium, High, and Urgent priority classifications with SLA deadlines.
- **Technician & Task Claiming**: Wardens can assign technicians or staff members can claim repair tasks directly.

### 📢 4. Campus Bulletins & Announcements
- **Targeted Notices**: Publish campus announcements, mess schedules, fee deadlines, and hostel rules.
- **Audience Scope**: Filter notices by specific hostels or broadcast campus-wide.

### 📊 5. Occupancy & Operational Analytics
- **Live Occupancy Tracking**: Monitor filled vs. vacant bed capacity metrics in real time.
- **SLA Breach Monitoring**: Track resolution turnaround times and open maintenance bottlenecks.
- **60-Day Hotspot Analysis**: Identify recurring hardware and plumbing issue patterns.

### 🛡️ 6. Role-Based Access Control (RBAC)
- **Automatic Role Assignment**:
  - 👑 **Admin**: (Full system access, role management, block configuration, audit logs).
  - 🛡️ **Warden**: (Leave pass approvals, maintenance dispatch, resident overview).
  - 🎓 **Student**: All default email addresses unless specified (Room details, leave requests, issue reporting).
- **Admin Audit Log**: Immutable record of all system security events, role changes, and allocations.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16.3](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Type Safety)
- **Styling**: Vanilla Tailwind CSS, Glassmorphism design, Dark UI aesthetic
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (SSR Client, PostgreSQL RLS policies)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm** or **yarn** or **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Freny07/Hostel-Manager.git
   cd Hostel-Manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
