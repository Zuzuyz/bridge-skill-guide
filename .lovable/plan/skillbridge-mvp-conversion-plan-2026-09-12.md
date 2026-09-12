# SkillBridge MVP conversion plan

## Goal
Convert the uploaded Stitch page into a maintainable, responsive SkillBridge application while preserving its lavender surfaces, navy typography, amber and purple accents, rounded cards, readiness visuals, and generous spacing.

## What I’ll build

1. **Design system and shared shell**
   - Translate the Stitch colors, type scale, radii, shadows, and motion into reusable design tokens.
   - Build shared brand navigation, role-aware application navigation, page headers, cards, progress visuals, status badges, empty/loading/error states, and the floating SkillBuddy entry point.

2. **Faithful landing page**
   - Recreate the supplied composition: floating navigation, centered hero, readiness preview, three-part ecosystem, skill demand, resume parser, career roadmap, internships, closing call-to-action, SkillBuddy, and footer.
   - Wire primary calls-to-action to registration, resume analysis, internships, and role experiences.

3. **Types, mock data, and service boundaries**
   - Add typed models for users, organizations, skills, resumes, gaps, roadmaps, internships, applications, and projects.
   - Isolate mock functions for resume upload/extraction, gap analysis, roadmap generation, internship recommendations, applications, and SkillBuddy responses so a later secure server integration can replace them.

4. **Authentication and role routing**
   - Build validated login and registration screens with role selection.
   - Persist the MVP session and user choices locally, then direct Student, Company, College, and Admin roles to their matching dashboards.

5. **Student career operating system**
   - Build dashboard, profile, skill profile, resume analysis, skill-gap analysis, roadmap, internship discovery/detail, and application tracking.
   - Add functional resume states, career switching, dynamic readiness/gap results, roadmap completion, internship filters, applications, and status timelines.

6. **Company, college, and admin experiences**
   - Build company dashboard, internship management, and candidate discovery with working filters and shortlisting.
   - Build college dashboard and student analytics with readiness, distribution, gap, demand, and placement charts.
   - Build an admin overview consistent with the same premium visual system.

7. **SkillBuddy assistant**
   - Use AI Elements for the transcript and composer.
   - Provide a floating panel and full assistant page with prompt suggestions, loading, mock replies, and tool-result presentation ready for a future server AI connection.

8. **Quality checks**
   - Add unique page metadata, keyboard-accessible controls, mobile/tablet/desktop behavior, and clear interactive feedback.
   - Validate navigation, forms, upload flow, filters, applications, roadmap actions, assistant interactions, charts, type safety, linting, and production build.

## Technical notes
- Keep TanStack Router, the project’s supported typed React router, while implementing every requested URL.
- Use React Query for async mock service operations and cached recommendation data.
- Use local storage only behind a small repository layer, making future backend replacement straightforward.
- Keep AI secrets off the client; no Gemini key or direct model call will be added.
- Use Recharts for college/company visual analytics and Lucide for interface icons.
