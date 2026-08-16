# Lab 1 — AI Use and Reflection

**LLM/agent used:** ChatGPT



| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Read the CPE334 Lab 1 requirements in the project files. Implement ONLY Issue #1: Set up the TokTickIT project foundation using React, TypeScript, Vite, Bootstrap, Node.js, Express, PostgreSQL, Prisma, Vitest, and Supertest. Use the required repository structure and do not implement later issues yet. | I used the result to create the initial frontend, backend, database, testing, and documentation structure. I also checked the setup and build results before moving to the next issue. |
| 2 | Implement ONLY CPE334 Lab 1 Issue #2: API Health Check. Add `GET /api/health` returning HTTP 200 with `status: ok` and `service: TokTickIT API`. Add a Supertest test, connect the React page to the endpoint, and show a useful error when the backend is unavailable. | I used the result to implement the health-check API and connect it to the frontend. I tested both the successful Online state and the unavailable-backend error behavior. |
| 3 | Implement ONLY CPE334 Lab 1 Issue #3: Create and seed IT request categories. Create the Prisma Category model, migration, and an idempotent seed containing Account and Access, Hardware, Software, and Network. | I used the result to create the Category model and database seed. I verified that the four required categories were stored without creating duplicates. |
| 4 | Implement the Lab 1 category-list feature by creating `GET /api/categories`, returning the four seeded categories, and displaying them in the React frontend after the system check succeeds. Add the required backend and frontend tests without adding functionality outside Lab 1. | I used the result to complete the final Lab 1 vertical slice. The frontend displays the four categories returned by the backend when the system is Online. |
| 5 | Help me verify all CPE334 Lab 1 backend and frontend tests using Vitest, Supertest, and React Testing Library, including the health endpoint, categories endpoint, heading, successful API state, and API failure state. | I ran the backend and frontend test suites and checked the results. The backend had 2 passing tests and the frontend had 3 passing tests, giving 5 passing Lab 1 tests in total. |
| 6 | Help me check the Lab 1 submission evidence, including the GitHub Project Kanban board, Issues, Pull Requests, feature-to-staging-to-main Git workflow, repository structure, README, `.gitignore`, test evidence, and peer-review documentation. | I compared the repository and GitHub evidence with the Lab 1 requirements. I updated the documentation and collected screenshots showing the final Kanban board, commit history, test results, repository structure, and peer-review evidence. |

## Reflection

My prompts became more effective when I clearly specified one issue at a time, the required technologies, expected behavior, files, and testing requirements. This helped keep each implementation within the scope of the Lab 1 requirements instead of implementing later features too early. I still reviewed and corrected the results when they did not exactly match my repository, particularly during the Git workflow, documentation, database setup, and test verification.T