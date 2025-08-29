# 🖥️ Optimal Workspace Setup for Both Projects

## Recommended Setup: YES, Use Cursor with Both Projects

### Why This Works Best:

1. **Single Source of Truth**
   - Both projects visible in one workspace
   - Easy to compare files side-by-side
   - Instant sync verification

2. **Shared Context**
   - Claude in Cursor understands both projects
   - Can make changes across projects
   - Prevents divergence

3. **Efficient Workflow**
   - No switching between windows
   - Unified terminal for both projects
   - Single Git interface

## How to Set Up Cursor Workspace

### Option 1: Multi-Root Workspace (RECOMMENDED)
```json
// Create a workspace file: kct-platform.code-workspace
{
  "folders": [
    {
      "name": "Frontend (Main)",
      "path": "./kct-menswear-v2"
    },
    {
      "name": "Backend (Admin)",
      "path": "./kct-admin-backend"
    }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "typescript.preferences.importModuleSpecifier": "relative"
  }
}
```

### Option 2: Parent Directory
Open the parent directory containing both projects:
```
/Users/ibrahim/Desktop/Unified X/
├── kct-menswear-v2/     (Frontend)
└── kct-admin-backend/   (Backend)
```

## Using Agents in Cursor

### ✅ YES - Agents Work Great in Cursor!

The agents we installed are designed for Cursor/Claude Code:

1. **Automatic Agent Detection**
   - Cursor recognizes `.claude/agents/` directory
   - Agents available via `/agents` command
   - Auto-invoked based on context

2. **Agent Benefits in Cursor**
   - Specialized help for specific tasks
   - Consistent code quality
   - Faster development

3. **Cross-Project Agent Usage**
   - Frontend agents help with React/UI
   - Backend agents help with database
   - Both work together seamlessly

## Optimal Terminal Setup in Cursor

### Split Terminal Configuration:
```
Terminal 1: Frontend
- cd kct-menswear-v2
- npm run dev (port 3000)

Terminal 2: Backend  
- cd kct-admin-backend
- npm run dev (port 3001)

Terminal 3: Shared Commands
- Git operations
- Testing both projects
- Database queries
```

### Keyboard Shortcuts:
- `Cmd+J` - Open Claude chat
- `Cmd+Shift+P` - Command palette
- `Cmd+\`` - Toggle terminal
- `Cmd+K Cmd+S` - Split editor

## File Organization Tips

### 1. Shared Files Location:
```
📁 Shared (in both projects)
├── src/lib/shared/
│   └── supabase-products.ts  (MUST BE IDENTICAL)
├── types/
│   └── shared-types.ts
└── tests/
    └── integration/
```

### 2. Quick Navigation:
- Use `Cmd+P` to quickly jump between projects
- Prefix searches: `frontend:` or `backend:`
- Recent files: `Cmd+E`

## Git Management

### Best Practice: Separate Repos
```bash
# Frontend commits
cd kct-menswear-v2 && git add . && git commit -m "feat: ..."

# Backend commits  
cd kct-admin-backend && git add . && git commit -m "feat: ..."

# Or use Source Control tab in Cursor for visual Git
```

## Daily Workflow in Cursor

### Morning Routine:
1. Open Cursor with workspace
2. Pull latest changes in both projects
3. Check `/agents` command works
4. Start both dev servers
5. Open Claude chat (`Cmd+J`)

### During Development:
1. Make changes in one project
2. Immediately sync to other project
3. Test both together
4. Use agents for specialized help

### Evening Routine:
1. Commit changes in both projects
2. Push to respective repos
3. Document any sync issues
4. Close unified workspace

## Pro Tips for Cursor

### 1. Use Multi-Cursor Editing:
When updating shared files:
- Open both versions
- `Cmd+D` to select same text
- Edit simultaneously

### 2. Agent Shortcuts:
```
/agents - List all agents
/agent frontend-developer - Use specific agent
@workspace - Reference entire workspace
@file - Reference specific file
```

### 3. Search Across Projects:
- `Cmd+Shift+F` - Search in all files
- Use regex: `supabase\.from\(`
- Filter by project folder

### 4. Extension Recommendations:
- GitLens - See Git history
- Error Lens - Inline errors
- Todo Tree - Track TODOs
- Thunder Client - API testing

## Benefits of This Setup

✅ **Instant Sync Verification** - See both files side-by-side
✅ **Unified Context** - Claude understands the full picture
✅ **Efficient Testing** - Run both projects simultaneously
✅ **Agent Integration** - All agents available in one place
✅ **Prevent Divergence** - Catch differences immediately

## Common Issues & Solutions

### "Too Many Files" Warning:
- Use `.gitignore` properly
- Exclude `node_modules` from search
- Focus workspace on `src` directories

### Performance Issues:
- Increase Cursor memory limit
- Close unnecessary files
- Use file excludes in settings

### Agent Not Working:
- Check `.claude/agents/` exists
- Restart Cursor
- Reinstall agents if needed

## Recommended Cursor Settings

```json
{
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,
  "editor.minimap.enabled": false,
  "editor.wordWrap": "on",
  "terminal.integrated.fontSize": 13,
  "workbench.sideBar.location": "left",
  "claude.multiFile": true,
  "claude.autoSave": true
}
```

This setup gives you maximum control and visibility over both projects! 🚀