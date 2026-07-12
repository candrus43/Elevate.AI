/**
 * Module 5: Coaching Academy — Full LMS Platform Backend
 * Enterprise training platform: content library, courses, quizzes, certifications, learning paths, enrollments, analytics.
 * Industry-agnostic. Does NOT overwrite existing functionality.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── AI LOGIC ─────────────────────────────────────────────────────────────────

/** Extract knowledge from content text (simulated AI extraction) */
function extractContentKnowledge(content: { id: string; title: string; content_text?: string; type: string }) {
  const topics = [`${content.title} Overview`, `${content.type} Best Practices`, `Advanced ${content.title}`];
  const insights = [`${content.title} is key for improving ${content.type} skills`, `Master ${content.title} to advance proficiency`];
  const qaPairs = [
    { q: `What is ${content.title}?`, a: `${content.title} is a ${content.type} resource covering key techniques.` },
    { q: `How do I improve ${content.type}?`, a: `Study ${content.title} and practice with roleplay.` },
  ];
  return { topics, insights, qaPairs, skills: [content.type, "communication"], keywords: [content.title.toLowerCase()] };
}

/** Generate quiz from content */
function generateQuizFromContent(content: any, count = 5) {
  const questions = [];
  const templates = [
    { q: `What is the primary focus of ${content.title}?`, opts: ["Customer needs", `${content.type} best practices`, "Product demos", "Closing"], correct: 1 },
    { q: `Which technique is effective for ${content.type}?`, opts: ["Active listening", "Talking more", "Ignoring objections", "Rushing"], correct: 0 },
    { q: `How to approach ${content.title}?`, opts: ["With preparation", "Improvising", "Using script only", "Avoiding topics"], correct: 0 },
  ];
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const t = templates[i];
    questions.push({ question: t.q, options: t.opts, correctAnswer: t.correct, explanation: `Focus on structured ${content.type} methodology.` });
  }
  return questions;
}

/** Answer a knowledge question */
function answerQuestion(question: string, knowledge: any[]) {
  const q = question.toLowerCase();
  const relevant = knowledge.filter((k: any) => q.includes(k.topic.toLowerCase()));
  if (relevant.length === 0) {
    return { answer: "Based on training materials, focus on foundational sales skills like discovery and objection handling.", sources: [] };
  }
  const k = relevant[0];
  return { answer: k.keyInsights?.[0] || `Key insight from ${k.topic}: practice these techniques.`, sources: [k.topic] };
}

/** Analyze learning skill gaps */
function analyzeSkillGaps(completedIds: string[], allContent: any[]) {
  const completed = new Set(completedIds);
  const types = [...new Set(allContent.map((c: any) => c.type))];
  return types.map((type) => {
    const typeItems = allContent.filter((c: any) => c.type === type);
    const done = typeItems.filter((c: any) => completed.has(c.id));
    const ratio = typeItems.length > 0 ? done.length / typeItems.length : 1;
    return ratio < 0.8 ? {
      skill: type, currentLevel: Math.round(ratio * 100), recommendedLevel: 80, gap: Math.round((0.8 - ratio) * 100),
      recommendations: typeItems.filter((c: any) => !completed.has(c.id)).map((c: any) => `Complete "${c.title}"`),
    } : null;
  }).filter(Boolean);
}

// ─── CONTENT LIBRARY (7 endpoints) ───────────────────────────────────────────

/** GET /api/academy/content */
export async function handleListContent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");
    let items = await db(sql`SELECT * FROM academy_content WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    if (items.length === 0) {
      const demos = [
        { type: "video", title: "Discovery Call Best Practices", desc: "Guide on effective discovery calls.", text: "Focus on pain points, budget, authority, and timeline." },
        { type: "document", title: "Objection Handling Playbook", desc: "Top 10 sales objections guide.", text: "Use LAER framework: Listen, Acknowledge, Explore, Respond." },
        { type: "playbook", title: "Enterprise Sales Playbook", desc: "Strategic playbook for enterprise deals.", text: "Multi-thread, engage executives, build champions." },
        { type: "script", title: "Cold Calling Script", desc: "Proven SDR cold calling script.", text: "Opening: 15-sec value statement. Close: schedule next step." },
        { type: "objection", title: "Price Objection Responses", desc: "Responses to price objections.", text: "Reframe around ROI, quantify value, offer flexible pricing." },
        { type: "product_knowledge", title: "Product Feature Deep Dive", desc: "Product knowledge training.", text: "Focus on features solving specific customer pain points." },
      ];
      for (const d of demos) {
        await db(sql`INSERT INTO academy_content (id, company_id, type, title, description, content_text, tags, categories) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${d.type}, ${d.title}, ${d.desc}, ${d.text}, ${JSON.stringify(["sales", d.type])}, ${JSON.stringify(["Sales Training"])})`).catch(() => {});
      }
      items = await db(sql`SELECT * FROM academy_content WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    }
    if (type) items = items.filter((i: any) => i.type === type);
    if (category) items = items.filter((i: any) => JSON.parse(i.categories || "[]").includes(category));
    if (tag) items = items.filter((i: any) => JSON.parse(i.tags || "[]").includes(tag));
    if (search) items = items.filter((i: any) => i.title.toLowerCase().includes(search.toLowerCase()) || (i.content_text || "").toLowerCase().includes(search.toLowerCase()));
    return jsonResponse({ content: items.map((i: any) => ({ ...i, tags: JSON.parse(i.tags || "[]"), categories: JSON.parse(i.categories || "[]") })) });
  } catch (e) { console.error("list content:", e); return jsonResponse({ error: "Failed to list content" }, 500); }
}

/** POST /api/academy/content/upload */
export async function handleUploadContent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { type, title, description, content_text, tags, categories } = await req.json();
    if (!type || !title) return jsonResponse({ error: "type and title required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_content (id, company_id, type, title, description, content_text, tags, categories, author_id) VALUES (${id}, ${user.companyId}, ${type}, ${title}, ${description || ""}, ${content_text || ""}, ${JSON.stringify(tags || [])}, ${JSON.stringify(categories || [])}, ${user.id})`);
    const knowledge = extractContentKnowledge({ id, title, content_text: content_text || "", type });
    for (const topic of knowledge.topics) {
      await db(sql`INSERT INTO academy_knowledge_base (id, company_id, content_id, topic, key_insights, qa_pairs, skills, keywords, relevance_score) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${id}, ${topic}, ${JSON.stringify(knowledge.insights)}, ${JSON.stringify(knowledge.qaPairs)}, ${JSON.stringify(knowledge.skills)}, ${JSON.stringify(knowledge.keywords)}, ${0.8})`).catch(() => {});
    }
    return jsonResponse({ success: true, content: { id, type, title } });
  } catch (e) { console.error("upload:", e); return jsonResponse({ error: "Failed to upload" }, 500); }
}

/** GET /api/academy/content/:id */
export async function handleGetContent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const items = await db(sql`SELECT * FROM academy_content WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (items.length === 0) return jsonResponse({ error: "Content not found" }, 404);
    const knowledge = await db(sql`SELECT * FROM academy_knowledge_base WHERE content_id = ${id}`);
    return jsonResponse({ content: { ...items[0], tags: JSON.parse(items[0].tags || "[]"), categories: JSON.parse(items[0].categories || "[]") }, knowledge });
  } catch (e) { return jsonResponse({ error: "Failed to load content" }, 500); }
}

/** PUT /api/academy/content/:id */
export async function handleUpdateContent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const body = await req.json();
    for (const [k, v] of Object.entries(body)) {
      if (k === "tags" || k === "categories") await db(sql`UPDATE academy_content SET ${db.raw(k)} = ${JSON.stringify(v)} WHERE id = ${id} AND company_id = ${user.companyId}`);
      else if (k !== "id") await db(sql`UPDATE academy_content SET ${db.raw(k)} = ${v} WHERE id = ${id} AND company_id = ${user.companyId}`);
    }
    await db(sql`UPDATE academy_content SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update" }, 500); }
}

/** DELETE /api/academy/content/:id */
export async function handleDeleteContent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM academy_content WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to delete" }, 500); }
}

/** GET /api/academy/content/:id/knowledge */
export async function handleGetContentKnowledge(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const knowledge = await db(sql`SELECT * FROM academy_knowledge_base WHERE content_id = ${id} ORDER BY relevance_score DESC`);
    return jsonResponse({ knowledge: knowledge.map((k: any) => ({ ...k, key_insights: JSON.parse(k.key_insights || "[]"), qa_pairs: JSON.parse(k.qa_pairs || "[]"), skills: JSON.parse(k.skills || "[]"), keywords: JSON.parse(k.keywords || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to load knowledge" }, 500); }
}

/** GET /api/academy/knowledge-base */
export async function handleSearchKnowledgeBase(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    let knowledge = await db(sql`SELECT kb.*, ac.title as content_title, ac.type as content_type FROM academy_knowledge_base kb JOIN academy_content ac ON ac.id = kb.content_id WHERE kb.company_id = ${user.companyId} ORDER BY kb.relevance_score DESC LIMIT 50`);
    if (query) knowledge = knowledge.filter((k: any) => k.topic.toLowerCase().includes(query.toLowerCase()) || k.content_title.toLowerCase().includes(query.toLowerCase()));
    return jsonResponse({ knowledge: knowledge.map((k: any) => ({ ...k, key_insights: JSON.parse(k.key_insights || "[]"), qa_pairs: JSON.parse(k.qa_pairs || "[]"), skills: JSON.parse(k.skills || "[]"), keywords: JSON.parse(k.keywords || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to search" }, 500); }
}

// ─── COURSES (5 endpoints) ───────────────────────────────────────────────────

/** GET /api/academy/courses */
export async function handleListCourses(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    let courses = await db(sql`SELECT * FROM academy_courses WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    if (courses.length === 0) {
      for (const d of [{ title: "Discovery Fundamentals", desc: "Master discovery calls.", items: [], diff: "beginner", cat: "Discovery", dur: 45 }, { title: "Objection Handling Mastery", desc: "Handle objections with confidence.", items: [], diff: "intermediate", cat: "Objections", dur: 60 }, { title: "Closing Techniques", desc: "Proven closing techniques.", items: [], diff: "advanced", cat: "Closing", dur: 45 }]) {
        await db(sql`INSERT INTO academy_courses (id, company_id, title, description, content_items, difficulty, category, estimated_duration_minutes) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${d.title}, ${d.desc}, ${JSON.stringify(d.items)}, ${d.diff}, ${d.cat}, ${d.dur})`).catch(() => {});
      }
      courses = await db(sql`SELECT * FROM academy_courses WHERE company_id = ${user.companyId} ORDER BY created_at DESC`);
    }
    return jsonResponse({ courses: courses.map((c: any) => ({ ...c, content_items: JSON.parse(c.content_items || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to list courses" }, 500); }
}

/** POST /api/academy/courses */
export async function handleCreateCourse(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, content_items, difficulty, category, estimated_duration_minutes } = await req.json();
    if (!title) return jsonResponse({ error: "title required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_courses (id, company_id, title, description, content_items, difficulty, category, estimated_duration_minutes) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${JSON.stringify(content_items || [])}, ${difficulty || "medium"}, ${category || "general"}, ${estimated_duration_minutes || 30})`);
    return jsonResponse({ success: true, course: { id, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create course" }, 500); }
}

/** GET /api/academy/courses/:id */
export async function handleGetCourse(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const courses = await db(sql`SELECT * FROM academy_courses WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (courses.length === 0) return jsonResponse({ error: "Course not found" }, 404);
    return jsonResponse({ course: { ...courses[0], content_items: JSON.parse(courses[0].content_items || "[]") } });
  } catch (e) { return jsonResponse({ error: "Failed to load course" }, 500); }
}

/** PUT /api/academy/courses/:id */
export async function handleUpdateCourse(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { title, description, content_items, difficulty, category, status } = await req.json();
    if (title !== undefined) await db(sql`UPDATE academy_courses SET title = ${title} WHERE id = ${id}`);
    if (description !== undefined) await db(sql`UPDATE academy_courses SET description = ${description} WHERE id = ${id}`);
    if (content_items !== undefined) await db(sql`UPDATE academy_courses SET content_items = ${JSON.stringify(content_items)} WHERE id = ${id}`);
    if (difficulty !== undefined) await db(sql`UPDATE academy_courses SET difficulty = ${difficulty} WHERE id = ${id}`);
    if (status !== undefined) await db(sql`UPDATE academy_courses SET status = ${status} WHERE id = ${id}`);
    await db(sql`UPDATE academy_courses SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update course" }, 500); }
}

/** DELETE /api/academy/courses/:id */
export async function handleDeleteCourse(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM academy_courses WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to delete course" }, 500); }
}

// ─── QUIZZES (5 endpoints) ──────────────────────────────────────────────────

/** GET /api/academy/quizzes */
export async function handleListQuizzes(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const quizzes = await db(sql`SELECT * FROM academy_quizzes WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    return jsonResponse({ quizzes: quizzes.map((q: any) => ({ ...q, questions: JSON.parse(q.questions || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to list quizzes" }, 500); }
}

/** POST /api/academy/quizzes */
export async function handleCreateQuiz(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, content_id, questions, passing_score, randomize_questions, time_limit_minutes, difficulty } = await req.json();
    if (!title) return jsonResponse({ error: "title required" }, 400);
    let quizQuestions = questions || [];
    if (content_id && quizQuestions.length === 0) {
      const items = await db(sql`SELECT * FROM academy_content WHERE id = ${content_id}`);
      if (items.length > 0) quizQuestions = generateQuizFromContent(items[0]);
    }
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_quizzes (id, company_id, title, description, content_id, questions, passing_score, randomize_questions, time_limit_minutes, difficulty) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${content_id || null}, ${JSON.stringify(quizQuestions)}, ${passing_score || 70}, ${randomize_questions || 0}, ${time_limit_minutes || null}, ${difficulty || "medium"})`);
    return jsonResponse({ success: true, quiz: { id, title, questionCount: quizQuestions.length } });
  } catch (e) { return jsonResponse({ error: "Failed to create quiz" }, 500); }
}

/** GET /api/academy/quizzes/:id */
export async function handleGetQuiz(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const quizzes = await db(sql`SELECT * FROM academy_quizzes WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (quizzes.length === 0) return jsonResponse({ error: "Quiz not found" }, 404);
    return jsonResponse({ quiz: { ...quizzes[0], questions: JSON.parse(quizzes[0].questions || "[]") } });
  } catch (e) { return jsonResponse({ error: "Failed to load quiz" }, 500); }
}

/** POST /api/academy/quizzes/:id/submit */
export async function handleSubmitQuiz(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { answers } = await req.json();
    const quizzes = await db(sql`SELECT * FROM academy_quizzes WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (quizzes.length === 0) return jsonResponse({ error: "Quiz not found" }, 404);
    const quiz = quizzes[0];
    const questions = JSON.parse(quiz.questions || "[]");
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers && answers[i] === questions[i].correctAnswer) correct++;
    }
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const attemptId = crypto.randomUUID();
    await db(sql`INSERT INTO academy_quiz_attempts (id, company_id, quiz_id, user_id, score, answers, time_taken_seconds, passed) VALUES (${attemptId}, ${user.companyId}, ${id}, ${user.id}, ${score}, ${JSON.stringify(answers || [])}, ${0}, ${score >= quiz.passing_score ? 1 : 0})`);
    return jsonResponse({ success: true, attempt: { id: attemptId, score, correct, total: questions.length, passed: score >= quiz.passing_score } });
  } catch (e) { return jsonResponse({ error: "Failed to submit quiz" }, 500); }
}

/** GET /api/academy/quizzes/:id/history */
export async function handleQuizHistory(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const attempts = await db(sql`SELECT * FROM academy_quiz_attempts WHERE quiz_id = ${id} AND user_id = ${user.id} ORDER BY attempted_at DESC LIMIT 20`);
    return jsonResponse({ attempts });
  } catch (e) { return jsonResponse({ error: "Failed to load history" }, 500); }
}

// ─── CERTIFICATIONS (4 endpoints) ────────────────────────────────────────────

/** GET /api/academy/certifications */
export async function handleListCertifications(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const certs = await db(sql`SELECT * FROM academy_certifications WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    return jsonResponse({ certifications: certs.map((c: any) => ({ ...c, prerequisites: JSON.parse(c.prerequisites || "[]"), quiz_ids: JSON.parse(c.quiz_ids || "[]"), content_ids: JSON.parse(c.content_ids || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to list certifications" }, 500); }
}

/** POST /api/academy/certifications */
export async function handleCreateCertification(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, prerequisites, quiz_ids, content_ids, expiry_days } = await req.json();
    if (!title) return jsonResponse({ error: "title required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_certifications (id, company_id, title, description, prerequisites, quiz_ids, content_ids, expiry_days) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${JSON.stringify(prerequisites || [])}, ${JSON.stringify(quiz_ids || [])}, ${JSON.stringify(content_ids || [])}, ${expiry_days || null})`);
    return jsonResponse({ success: true, certification: { id, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create certification" }, 500); }
}

/** GET /api/academy/certifications/:id */
export async function handleGetCertification(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const certs = await db(sql`SELECT * FROM academy_certifications WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (certs.length === 0) return jsonResponse({ error: "Certification not found" }, 404);
    return jsonResponse({ certification: { ...certs[0], prerequisites: JSON.parse(certs[0].prerequisites || "[]"), quiz_ids: JSON.parse(certs[0].quiz_ids || "[]"), content_ids: JSON.parse(certs[0].content_ids || "[]") } });
  } catch (e) { return jsonResponse({ error: "Failed to load certification" }, 500); }
}

/** POST /api/academy/certifications/:id/earn */
export async function handleEarnCertification(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const certs = await db(sql`SELECT * FROM academy_certifications WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (certs.length === 0) return jsonResponse({ error: "Certification not found" }, 404);
    const quizIds = JSON.parse(certs[0].quiz_ids || "[]");
    let allPassed = true;
    for (const qid of quizIds) {
      const best = await db(sql`SELECT MAX(score) as best_score FROM academy_quiz_attempts WHERE quiz_id = ${qid} AND user_id = ${user.id}`);
      if (!best[0]?.best_score || best[0].best_score < (await db(sql`SELECT passing_score FROM academy_quizzes WHERE id = ${qid}`))[0]?.passing_score) allPassed = false;
    }
    if (!allPassed) return jsonResponse({ error: "Complete all prerequisite quizzes first" }, 400);
    const enrollmentId = crypto.randomUUID();
    await db(sql`INSERT INTO academy_enrollments (id, company_id, user_id, enrollable_type, enrollable_id, status, score, completed_at) VALUES (${enrollmentId}, ${user.companyId}, ${user.id}, ${"certification"}, ${id}, ${"completed"}, ${100}, ${datetime('now')})`);
    return jsonResponse({ success: true, message: "Certification earned!", enrollmentId });
  } catch (e) { return jsonResponse({ error: "Failed to earn certification" }, 500); }
}

// ─── LEARNING PATHS (4 endpoints) ────────────────────────────────────────────

/** GET /api/academy/learning-paths */
export async function handleListLearningPaths(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const paths = await db(sql`SELECT * FROM academy_learning_paths WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    return jsonResponse({ learningPaths: paths.map((p: any) => ({ ...p, steps: JSON.parse(p.steps || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to list paths" }, 500); }
}

/** POST /api/academy/learning-paths */
export async function handleCreateLearningPath(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, steps, difficulty, category, estimated_duration_days } = await req.json();
    if (!title) return jsonResponse({ error: "title required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_learning_paths (id, company_id, title, description, steps, difficulty, category, estimated_duration_days) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${JSON.stringify(steps || [])}, ${difficulty || "medium"}, ${category || "general"}, ${estimated_duration_days || 30})`);
    return jsonResponse({ success: true, learningPath: { id, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create path" }, 500); }
}

/** GET /api/academy/learning-paths/:id */
export async function handleGetLearningPath(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const paths = await db(sql`SELECT * FROM academy_learning_paths WHERE id = ${id} AND company_id = ${user.companyId}`);
    if (paths.length === 0) return jsonResponse({ error: "Learning path not found" }, 404);
    const enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE enrollable_id = ${id} AND enrollable_type = 'learning_path' AND company_id = ${user.companyId}`);
    return jsonResponse({ learningPath: { ...paths[0], steps: JSON.parse(paths[0].steps || "[]") }, enrollments });
  } catch (e) { return jsonResponse({ error: "Failed to load path" }, 500); }
}

/** POST /api/academy/learning-paths/:id/enroll */
export async function handleEnrollLearningPath(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const existing = await db(sql`SELECT * FROM academy_enrollments WHERE user_id = ${user.id} AND enrollable_id = ${id} AND enrollable_type = 'learning_path'`);
    if (existing.length > 0) return jsonResponse({ error: "Already enrolled" }, 400);
    const enrollmentId = crypto.randomUUID();
    await db(sql`INSERT INTO academy_enrollments (id, company_id, user_id, enrollable_type, enrollable_id, status) VALUES (${enrollmentId}, ${user.companyId}, ${user.id}, ${"learning_path"}, ${id}, ${"active"})`);
    return jsonResponse({ success: true, enrollment: { id: enrollmentId } });
  } catch (e) { return jsonResponse({ error: "Failed to enroll" }, 500); }
}

// ─── ENROLLMENTS & PROGRESS (3 endpoints) ─────────────────────────────────────

/** GET /api/academy/enrollments */
export async function handleListEnrollments(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    let enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE user_id = ${user.id} ORDER BY started_at DESC LIMIT 50`);
    if (type) enrollments = enrollments.filter((e: any) => e.enrollable_type === type);
    return jsonResponse({ enrollments });
  } catch (e) { return jsonResponse({ error: "Failed to list enrollments" }, 500); }
}

/** POST /api/academy/enrollments/:id/update-progress */
export async function handleUpdateProgress(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { progress, score } = await req.json();
    if (progress >= 100) await db(sql`UPDATE academy_enrollments SET progress = ${progress}, score = ${score || null}, status = 'completed', completed_at = datetime('now') WHERE id = ${id} AND user_id = ${user.id}`);
    else await db(sql`UPDATE academy_enrollments SET progress = ${progress}, score = ${score || null} WHERE id = ${id} AND user_id = ${user.id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update progress" }, 500); }
}

/** GET /api/academy/progress/:userId */
export async function handleUserProgress(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const userId = new URL(req.url).pathname.split("/").pop();
    const enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`);
    const completed = enrollments.filter((e: any) => e.status === "completed").length;
    const total = enrollments.length;
    const avgScore = enrollments.filter((e: any) => e.score !== null).reduce((s: number, e: any) => s + (e.score || 0), 0) / Math.max(enrollments.filter((e: any) => e.score !== null).length, 1);
    const quizAttempts = await db(sql`SELECT * FROM academy_quiz_attempts WHERE user_id = ${userId} ORDER BY attempted_at DESC LIMIT 20`);
    return jsonResponse({ enrollments, progress: { total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, avgScore: Math.round(avgScore) }, quizAttempts });
  } catch (e) { return jsonResponse({ error: "Failed to load progress" }, 500); }
}

// ─── MANAGER ASSIGNMENTS (3 endpoints) ───────────────────────────────────────

/** GET /api/academy/assignments */
export async function handleListAssignments(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const assignments = await db(sql`SELECT aa.*, u.name as rep_name FROM academy_assignments aa JOIN users u ON u.id = aa.rep_id WHERE aa.manager_id = ${user.id} ORDER BY aa.created_at DESC LIMIT 50`);
    return jsonResponse({ assignments });
  } catch (e) { return jsonResponse({ error: "Failed to list assignments" }, 500); }
}

/** POST /api/academy/assignments */
export async function handleCreateAssignment(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { rep_id, assignable_type, assignable_id, due_date } = await req.json();
    if (!rep_id || !assignable_type || !assignable_id) return jsonResponse({ error: "rep_id, assignable_type, assignable_id required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO academy_assignments (id, company_id, manager_id, rep_id, assignable_type, assignable_id, due_date) VALUES (${id}, ${user.companyId}, ${user.id}, ${rep_id}, ${assignable_type}, ${assignable_id}, ${due_date || null})`);
    return jsonResponse({ success: true, assignment: { id } });
  } catch (e) { return jsonResponse({ error: "Failed to create assignment" }, 500); }
}

/** PUT /api/academy/assignments/:id */
export async function handleUpdateAssignment(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { due_date, status } = await req.json();
    if (status !== undefined) await db(sql`UPDATE academy_assignments SET status = ${status} WHERE id = ${id} AND manager_id = ${user.id}`);
    if (due_date !== undefined) await db(sql`UPDATE academy_assignments SET due_date = ${due_date} WHERE id = ${id} AND manager_id = ${user.id}`);
    if (status === "completed") await db(sql`UPDATE academy_assignments SET completed_at = datetime('now') WHERE id = ${id} AND manager_id = ${user.id}`);
    await db(sql`UPDATE academy_assignments SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update assignment" }, 500); }
}

// ─── AI KNOWLEDGE ASSISTANT (2 endpoints) ─────────────────────────────────────

/** POST /api/academy/knowledge/ask */
export async function handleAskKnowledge(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { question } = await req.json();
    if (!question) return jsonResponse({ error: "question required" }, 400);
    const knowledge = await db(sql`SELECT * FROM academy_knowledge_base WHERE company_id = ${user.companyId} ORDER BY relevance_score DESC LIMIT 50`);
    const result = answerQuestion(question, knowledge);
    const chatId = crypto.randomUUID();
    await db(sql`INSERT INTO academy_knowledge_chat (id, company_id, user_id, question, answer, sources) VALUES (${chatId}, ${user.companyId}, ${user.id}, ${question}, ${result.answer}, ${JSON.stringify(result.sources)})`);
    return jsonResponse({ answer: result.answer, sources: result.sources, chatId });
  } catch (e) { return jsonResponse({ error: "Failed to answer question" }, 500); }
}

/** GET /api/academy/knowledge/suggestions */
export async function handleKnowledgeSuggestions(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 20`);
    const completed = enrollments.filter((e: any) => e.status === "completed").map((e: any) => e.enrollable_id);
    const content = await db(sql`SELECT id, title, type FROM academy_content WHERE company_id = ${user.companyId} LIMIT 20`);
    const gaps = analyzeSkillGaps(completed, content);
    const suggestions = gaps.map((g: any) => `Consider completing ${g.recommendations[0] || "training in " + g.skill} to close your ${g.gap}% gap.`);
    const notDone = content.filter((c: any) => !completed.includes(c.id));
    if (suggestions.length === 0 && notDone.length > 0) suggestions.push(`Explore "${notDone[0].title}" to expand your skills.`);
    if (suggestions.length === 0) suggestions.push("Great job! You've completed all available content. Check back for new material.");
    return jsonResponse({ suggestions, skillGaps: gaps });
  } catch (e) { return jsonResponse({ error: "Failed to get suggestions" }, 500); }
}

// ─── LEARNING ANALYTICS (3 endpoints) ────────────────────────────────────────

/** GET /api/academy/analytics */
export async function handleLearningAnalytics(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE company_id = ${user.companyId} LIMIT 200`);
    const total = enrollments.length;
    const completed = enrollments.filter((e: any) => e.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const quizAttempts = await db(sql`SELECT * FROM academy_quiz_attempts WHERE company_id = ${user.companyId} LIMIT 200`);
    const avgQuizScore = quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s: number, a: any) => s + a.score, 0) / quizAttempts.length) : 0;
    const totalContent = (await db(sql`SELECT COUNT(*) as c FROM academy_content WHERE company_id = ${user.companyId}`))[0]?.c || 0;
    return jsonResponse({ analytics: { totalEnrollments: total, completedEnrollments: completed, completionRate, avgQuizScore, totalQuizAttempts: quizAttempts.length, totalContent } });
  } catch (e) { return jsonResponse({ error: "Failed to load analytics" }, 500); }
}

/** GET /api/academy/analytics/team/:teamId */
export async function handleTeamLearningAnalytics(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const teamId = new URL(req.url).pathname.split("/").pop();
    const users = await db(sql`SELECT id, name FROM users WHERE company_id = ${user.companyId}`);
    const allEnrollments = await db(sql`SELECT * FROM academy_enrollments WHERE company_id = ${user.companyId} LIMIT 500`);
    const allAttempts = await db(sql`SELECT * FROM academy_quiz_attempts WHERE company_id = ${user.companyId} LIMIT 500`);
    const teamEnrollments = allEnrollments.filter((e: any) => users.some((u: any) => u.id === e.user_id));
    const completed = teamEnrollments.filter((e: any) => e.status === "completed").length;
    const total = teamEnrollments.length;
    const avgScore = allAttempts.length > 0 ? Math.round(allAttempts.reduce((s: number, a: any) => s + a.score, 0) / allAttempts.length) : 0;
    return jsonResponse({ teamId, analytics: { totalEnrollments: total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, avgQuizScore: avgScore, activeUsers: users.length } });
  } catch (e) { return jsonResponse({ error: "Failed to load team analytics" }, 500); }
}

/** GET /api/academy/analytics/skill-gaps */
export async function handleAnalyticsSkillGaps(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const content = await db(sql`SELECT id, title, type FROM academy_content WHERE company_id = ${user.companyId} LIMIT 50`);
    const enrollments = await db(sql`SELECT * FROM academy_enrollments WHERE company_id = ${user.companyId} LIMIT 200`);
    const completedIds = enrollments.filter((e: any) => e.status === "completed").map((e: any) => e.enrollable_id);
    const gaps = analyzeSkillGaps(completedIds, content);
    return jsonResponse({ skillGaps: gaps });
  } catch (e) { return jsonResponse({ error: "Failed to analyze skill gaps" }, 500); }
}
