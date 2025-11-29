# 🚀 AI Resume Scout - Professional ATS System

## Your Exact ATS Logic Implementation

This system implements your **exact 7-step ATS evaluation process** with professional-grade accuracy:

### 🔍 **STEP 1: Resume Parsing (14 Parameters)**
1. Candidate Summary (2 lines)
2. Total Experience (Years) 
3. Relevant Experience (Years related to JD)
4. Skills (Technical + Soft Skills)
5. Tools & Technologies Used
6. Certifications
7. Education Details
8. Job Titles Held
9. Projects & Responsibilities
10. Achievements / Awards
11. Domain Experience (IT, Finance, Healthcare, etc.)
12. Contact Information
13. Resume Keywords Extracted
14. Seniority Level (Junior | Mid | Senior)

### 🔍 **STEP 2: Job Description Parsing (9 Parameters)**
1. Mandatory Skills
2. Good-to-Have Skills
3. Required Experience
4. Required Tools/Technologies
5. Role Responsibilities
6. Education Requirements
7. Preferred Certifications
8. Required Industry Domain
9. Relevant Keywords

### 🔍 **STEP 3: ATS Algorithm - Skill Matching & Scoring**
- Skill synonym matching (ML = Machine Learning)
- Keyword density analysis
- Experience relevance scoring
- Education requirement verification

### 🔍 **STEP 4: Professional ATS Weights (Your Exact Formula)**
- **Skills Match** → 40%
- **Experience Match** → 25%
- **Role Responsibilities Match** → 15%
- **Education Match** → 10%
- **Certifications Match** → 5%
- **Keywords/Tools Match** → 5%

### 🔍 **STEP 5: Result Classification**
- **Score ≥ 80%**: "SHORTLISTED"
- **Score 50%-79%**: "BORDERLINE – NEEDS IMPROVEMENT"
- **Score < 50%**: "NOT SHORTLISTED"

### 🔍 **STEP 6: Improvement Analysis**
- Missing Technical Skills
- Missing Soft Skills
- Missing Tools/Frameworks
- Missing Certifications
- Resume optimization tips

### 🔍 **STEP 7: Professional Summary (3-4 lines)**
- Candidate Fit %
- Years of Experience
- Matched Skills
- Shortlisting Status
- Fit reasoning

---

## 🎯 **How to Run**

### **Backend (ATS Engine)**
```bash
cd backend
python main.py
```
**Server**: http://localhost:8000  
**API Docs**: http://localhost:8000/docs

### **Frontend (User Interface)**
```bash
cd frontend  
npm run dev -- --port 8080
```
**Candidate Portal**: http://localhost:8080  
**HR Dashboard**: http://localhost:8080/hr/dashboard

---

## ✅ **Unified Logic Guarantee**

**No duplicate logic exists!** Both candidate and HR sides use the **exact same ATS evaluation engine**:

- **Candidate Side**: `POST /api/ats/evaluate-resume` 
- **HR Side**: `POST /api/ats/batch-evaluate`

Both endpoints call the same `ATSScoringService.evaluate_candidate()` method with your exact 7-step process.

---

## 🔧 **API Endpoints**

| Endpoint | Purpose | Users |
|----------|---------|-------|
| `POST /api/ats/evaluate-resume` | Single resume evaluation | Candidate |
| `POST /api/ats/batch-evaluate` | Batch resume processing | HR |
| `GET /api/health` | System health check | System |

---

## ✨ **Features**

- ✅ **Professional ATS Scoring** with your exact weights
- ✅ **Identical evaluation logic** across candidate and HR sides
- ✅ **No hallucinations** - strict data extraction only
- ✅ **Skill synonym matching** for accurate assessment
- ✅ **Real-time evaluation** with comprehensive feedback
- ✅ **Recruiter-ready summaries** in professional format

Your ATS logic is now fully functional and production-ready! 🎉