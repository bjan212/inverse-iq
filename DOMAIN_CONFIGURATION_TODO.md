# Domain Configuration for www.xrypt.net - TODO

## Progress Tracker

### ✅ Completed
- [x] Analysis of current codebase
- [x] Identified all files needing updates

### 🔄 In Progress
- [ ] Update HTML files (InverseIQ → Xrypt)
- [ ] Configure CORS for production domain
- [ ] Add domain environment variables
- [ ] Create .env.example template
- [ ] Update documentation

### 📋 Pending
- [ ] Test domain configuration
- [ ] Verify CORS settings
- [ ] Update deployment checklist

---

## Files to Update

### 1. HTML Pages (Branding Updates)
- [ ] public/index.html - Title and branding
- [ ] public/terms.html - All InverseIQ references
- [ ] public/privacy.html - All InverseIQ references
- [ ] public/signals.html - Check and update if needed
- [ ] public/admin.html - Check and update if needed

### 2. Security & Configuration
- [ ] src/middleware/security.js - Add www.xrypt.net to CORS
- [ ] Create .env.example - Domain configuration template

### 3. Documentation
- [ ] PROJECT_TIMELINE.md - Update project name
- [ ] Add DOMAIN_SETUP_GUIDE.md - DNS and SSL instructions

---

## Domain Configuration Details

**Production Domain:** www.xrypt.net
**Email Domain:** notify@xrypt.net (already configured)
**Support Email:** support@xrypt.net

**CORS Origins to Add:**
- https://www.xrypt.net
- https://xrypt.net

**Environment Variables:**
- DOMAIN=www.xrypt.net
- ALLOWED_ORIGINS=https://www.xrypt.net,https://xrypt.net

---

## Notes
- DigitalOcean deployment guide will remain unchanged (deployment in progress)
- Email service already configured with xrypt.net domain
- README already references xrypt.net
