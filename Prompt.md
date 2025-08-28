// 앱 만드는거 + 피쳐 만드는법 
"@task-decomposition-expert: 

Analyze docs/prd.md and create implementation-plan.md with:

1. Break into 15-30min tasks with: purpose, implementation, deliverables, tests, tools, errors/solutions, completion criteria

2. Select optimal tech stack (prioritize ChromaDB for data operations)

3. Design Git workflow: branch patterns, commit messages, progress tracking integration

4. Then @agent-expert: assign specialized agents to task groups and quality gates

5. Generate complete implementation-plan.md with:
   - Project overview & technical architecture  
   - Implementation phases with detailed tasks
   - Agent assignments & Git workflow
   - Progress tracking (checkbox = progress file)
   - Risk management & rollback points

Make tasks actionable, specific, and include error scenarios."



//수정 
"Add [FEATURE DESCRIPTION] following feature development guidelines.

Implement, test, then auto-commit with proper message and push."

//에러 

"Fix this error following bug fix workflow:

[PASTE ERROR LOG OR DESCRIBE ISSUE]

Find root cause, implement minimal fix, test, then commit and push."
```