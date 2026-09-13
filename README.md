# SkillBridge Connect

I have uploaded a Stitch-generated HTML implementation for my SkillBridge project.

Convert this static Stitch design into a proper modern, functional web application.

PROJECT:

SkillBridge — Academia × Industry

CORE PURPOSE:

SkillBridge connects students, colleges, and companies through AI-powered skill mapping, career guidance, internships, projects, and placement opportunities.

IMPORTANT:

The uploaded Stitch HTML is the PRIMARY VISUAL DESIGN SOURCE.

Preserve the visual quality and overall design language of the Stitch implementation:

- light lavender/white background

- dark navy typography

- warm yellow/orange primary accent

- purple secondary accent

- green success accent

- rounded cards

- large typography

- soft shadows

- pill-shaped buttons

- progress bars

- readiness score

- premium EdTech/SaaS appearance

- generous whitespace

- responsive layout

- subtle animations

Do NOT replace the design with a generic admin dashboard.

Do NOT simplify the UI into plain forms and tables.

Do NOT redesign the landing page unnecessarily.

Convert the existing Stitch HTML into a maintainable application architecture.

TECH STACK:

- React

- TypeScript

- Tailwind CSS

- React Router

- Lucide React icons

- React Query where useful

- Component-based architecture

APPLICATION ROLES:

1. STUDENT

2. COMPANY

3. COLLEGE

4. ADMIN

MVP STUDENT FLOW:

Landing Page

→ Register/Login

→ Student Profile

→ Upload Resume

→ AI Skill Extraction

→ Skill Profile

→ Select Target Career

→ AI Skill Gap Analysis

→ AI Career Roadmap

→ Recommended Internships

→ Internship Details

→ Apply

→ Application Tracker

Create these main routes:

/

Landing page

/login

Login

/register

Registration with role selection

/student/dashboard

Student dashboard

/student/profile

Student profile

/student/skills

AI skill profile

/student/resume

Resume upload and AI extraction

/student/skill-gap

Skill gap analysis

/student/roadmap

AI career roadmap

/internships

Internship discovery

/internships/:id

Internship details

/student/applications

Application tracker

/company/dashboard

Company dashboard

/company/internships

Company internship management

/company/candidates

Candidate discovery

/college/dashboard

College dashboard

/college/students

Student analytics

/admin/dashboard

Admin dashboard

/ai-assistant

SkillBuddy AI assistant

LANDING PAGE:

Use the uploaded Stitch design as the base.

The landing page should contain:

1. Floating SkillBridge navbar

2. Hero section:

"Build the skills. Connect with industry. Launch your career."

3. CTA buttons:

"Start Your Journey"

"Explore Opportunities"

4. Industry readiness preview

5. Trusted Career Ecosystem:

- For Students

- For Colleges

- For Companies

6. Industry Skill Demand section

7. AI Resume Skill Parser section

8. Career roadmap section

9. Internship opportunities section

10. Strong CTA section

11. SkillBuddy floating AI assistant

12. Footer

STUDENT DASHBOARD:

Create a polished career operating system rather than a traditional college dashboard.

Display:

Industry Readiness

72%

Target Career:

AI Engineer

Top Skills:

Python 92%

SQL 81%

React 74%

Machine Learning 58%

AWS 46%

Skill gaps:

Deep Learning

TensorFlow

MLOps

Recommended internship:

AI/ML Intern

92% Skill Match

Dashboard sections:

- Industry Readiness

- My Skills

- Skill Gaps

- Career Roadmap

- Recommended Internships

- Recommended Projects

- Applications

- Achievements

RESUME ANALYSIS:

Create a functional resume upload UI.

Support:

PDF

DOCX

After upload, show an analysis state.

Then display extracted skills such as:

Python

FastAPI

NumPy

Pandas

SQL

PostgreSQL

React

Machine Learning

Scikit-Learn

AWS

Show confidence scores.

Example:

Python — 98% confidence

SQL — 96% confidence

Machine Learning — 85% confidence

For the initial MVP, create a clean mock AI service layer so the UI works without requiring a real API key.

Keep the AI service isolated so it can later be connected to Gemini.

SKILL GAP ANALYSIS:

Allow the student to select a target career.

Example:

AI Engineer

Compare:

CURRENT SKILLS

against

INDUSTRY REQUIRED SKILLS

Categorize skills into:

Strong

Needs Improvement

Missing

Calculate:

Industry Readiness Score

Show a visual gap analysis.

Example:

Python       Strong       92%

SQL          Strong       81%

ML           Improve      58%

AWS          Improve      46%

TensorFlow   Missing

MLOps        Missing

CAREER ROADMAP:

Create a visually attractive roadmap/timeline.

Example:

STEP 1

Strengthen Python

STEP 2

Learn Machine Learning

STEP 3

Learn Deep Learning

STEP 4

Learn TensorFlow/PyTorch

STEP 5

Learn MLOps

STEP 6

Build AI Projects

STEP 7

Apply for AI Engineering Internships

Each roadmap item should contain:

- skill

- status

- difficulty

- estimated time

- recommended resources

- project suggestion

INTERNSHIP DISCOVERY:

Create internship cards with:

Company

Role

Location

Duration

Stipend

Required skills

Skill match percentage

Verified company badge

Example:

AI/ML Intern

HyperScale AI

Bengaluru • Hybrid

6 Months

₹25,000/month

92% Skill Match

Matched Skills:

Python

SQL

Machine Learning

Missing:

AWS

Button:

Apply Now

APPLICATION TRACKER:

Show application stages:

Applied

Under Review

Shortlisted

Interview

Selected

Rejected

Use a visual timeline/status system.

COMPANY DASHBOARD:

Companies should be able to:

- Create company profile

- Post internship

- Define required skills

- View applicants

- Search students

- Filter candidates by skills

- View candidate skill profiles

- Shortlist candidates

Candidate cards should show:

Name

College

Target Role

Industry Readiness

Top Skills

Skill Match

Projects

COLLEGE DASHBOARD:

Show:

Total Students

Industry Readiness

Placement Readiness

Top Skill Gaps

Industry Demand

Internship Opportunities

Charts should show:

- skill distribution

- readiness distribution

- top missing skills

- industry demand

- placement readiness

Use Recharts where appropriate.

SKILLBUDDY:

Create a floating AI assistant.

It should have a polished chat interface.

Example questions:

"What skills do I need to become an AI Engineer?"

"Why is my readiness score 72%?"

"What internships match my skills?"

"What should I learn next?"

For the initial implementation, use a mock response service.

Keep the service architecture ready for future Gemini integration.

DATA:

Use realistic mock data initially.

Create clean TypeScript types/interfaces for:

User

Student

Company

College

Skill

CareerRole

Resume

StudentSkill

SkillGap

Roadmap

Internship

Application

Project

ARCHITECTURE:

Organize the application into reusable components.

Suggested structure:

src/

  components/

    ui/

    navbar/

    cards/

    charts/

    skills/

    internships/

    roadmap/

    ai/

  pages/

    Landing/

    Login/

    Register/

    Student/

    Company/

    College/

    Admin/

  services/

    ai/

    api/

  data/

  types/

  hooks/

  layouts/

  utils/

Create reusable components rather than putting everything into one file.

FUNCTIONALITY:

Buttons must work.

Navigation must work.

Forms must work.

Login/register should have client-side validation.

Role selection should determine the appropriate dashboard.

Resume upload should show upload/progress/analysis states.

Skill gap should update based on selected career.

Internship filters should work.

Application button should update application status.

Roadmap should allow marking steps complete.

SkillBuddy should open as a chat panel.

Use local state/localStorage for the MVP where backend functionality is not yet available.

IMPORTANT BACKEND PREPARATION:

Do not hard-code the architecture in a way that makes future backend integration difficult.

Create service functions such as:

uploadResume()

extractSkills()

analyzeSkillGap()

generateRoadmap()

getRecommendedInternships()

applyToInternship()

Initially these can return mock data.

Later these will connect to our Node.js/Express backend and Gemini AI.

SECURITY:

Never expose Gemini API keys in frontend code.

All future AI API calls must go through the backend.

QUALITY:

Make the application production-quality in structure.

Use responsive design for desktop, tablet and mobile.

Use accessible buttons, inputs, labels and navigation.

Add loading states.

Add empty states.

Add error states.

Add hover states and subtle transitions.

Avoid excessive animation.

MOST IMPORTANT:

First reproduce the Stitch design faithfully.

Then make it functional.

Do not replace the premium Stitch UI with a generic dashboard template.

The final result should feel like a premium AI-powered career platform connecting Academia × Industry.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/85beb166-044d-4387-8392-36383c8e8096).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
