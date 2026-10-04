# AI Use and Reflection

## AI Tool Used

* **LLM:** ChatGPT
* **Use:** Development support, debugging, testing, documentation, Git workflow guidance, and review of implementation decisions.

## Key Prompts / Uses

During Lab 3 development, ChatGPT was used for the following types of tasks:

1. Explain the Lab 3 requirements and break them into implementation tasks.
2. Review existing project code before making changes.
3. Help debug TypeScript, Prisma, API, and Playwright test failures.
4. Suggest minimal changes to fix failing tests while preserving the existing project structure.
5. Review API authorization and role-based access control behavior.
6. Review automated test coverage and identify missing regression cases.
7. Help organize Git branches, commits, pull requests, and the `lab3-staging` workflow.
8. Review and improve Lab 3 specification, API specification, UI specification, and test documentation.
9. Help interpret Playwright and Vitest output during final verification.
10. Help prepare the final verification evidence and documentation.

## How AI Was Used

AI was used as a development assistant rather than as a replacement for implementation and verification. Existing project files, terminal output, test results, Git history, and requirements were checked before deciding whether a suggested change was appropriate.

The implementation was then verified using the project's own automated tests and build commands. Final decisions about the code, Git history, documentation, and submitted evidence remained with the project team.

## Reflection

Using an AI coding assistant was most useful for debugging and reviewing existing work. It helped identify likely causes of errors and provided smaller changes that could be tested quickly.

However, AI suggestions were not always accepted directly. They had to be checked against the existing architecture, assignment requirements, and actual test results. This was especially important for authorization rules, database behavior, Git history, and documentation because an AI-generated answer could be technically reasonable but inconsistent with the project.

The final verification therefore relied on the project's automated tests, builds, and Git history rather than on AI output alone.
