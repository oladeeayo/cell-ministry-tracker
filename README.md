# Cell Ministry Tracker

A web application for church cell groups to track attendance, manage members, and monitor engagement across zones and cells.

## Who Is This For?

- **Community Pastors / District Leaders** – View attendance across all zones
- **Zonal Leaders** – Monitor cells within their zone
- **Cell Leaders** – Take attendance and manage their cell members
- **Asst. Cell Leaders / E-Group Leaders** – Assist with attendance tracking

## Getting Started

### 1. Create an account

Open the app and click **Create Account**. Choose your role (e.g. Cell Leader) and fill in your details. After registering, sign in with your email and password.

### 2. Navigate the app

Use the sidebar to move between sections:

- **Dashboard** – See your cell's stats: attendance rate, member count, visitors, and at-risk members
- **Attendance** – Mark who was present on each Sunday
- **Add Member** – Register new members under your cell (members don't need login accounts)
- **Analytics** – View historical trends and compare performance
- **Profile** – Update your name, phone, or password

## Features

### Attendance Tracking
- Mark members as present or absent for each Sunday
- Calendar view shows attendance history at a glance (green = good, yellow = partial, red = low)
- Date range filtering for custom reports

### Member Management
- Add, edit, or remove members
- Bulk import members via CSV
- Track visitors separately from regular members

### At-Risk Detection
Members with 3+ consecutive absences are flagged as "at-risk." This helps leaders identify members who may be disengaging and need follow-up.

### Role Hierarchy
Each user has a role that determines what they can see and do:
- `COMMUNITY_PASTOR` / `DISTRICT_LEADER` – Full overview
- `ZONAL_LEADER` – Their zone and its cells
- `CELL_LEADER` – Their cell's members and attendance
- `ASST_CELL_LEADER` / `E_GROUP_LEADER` – Assist with attendance

## Tech Stack

- **Next.js 14** (React framework)
- **NextAuth.js** (authentication)
- **Prisma** (database ORM)
- **SQLite** (database)
- **Tailwind CSS** (styling)
- **Recharts** (charts)

## Need Help?

If you run into issues, check that you're signed in and have the correct role assigned. Contact your administrator if you believe your role is incorrect.
