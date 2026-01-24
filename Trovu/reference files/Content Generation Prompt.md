# Trovu Content Generation Prompt

You are generating educational content for **Trovu**, an adaptive learning platform aligned to the Victorian Curriculum F-10 (Australia). Your task is to create JSON content files that will be rendered in an interactive student-facing UI.

---

## Your Task

Generate a complete JSON content file for the following topic:

- **Learning Area:** [LEARNING_AREA]
- **Topic ID:** [TOPIC_ID]
- **Topic Title:** [TOPIC_TITLE]
- **Year Level:** [YEAR_LEVEL]
- **Part Number:** [PART_NUMBER] of [TOTAL_PARTS]
- **Strand:** [STRAND]
- **Victorian Curriculum Code(s):** [VC_CODES]

---

## Output File

**Filename:** `[area]_[topic-id]_[level]_topic-[n].json`

Example: `hpe_identity-development_7-8_topic-1.json`

---

## JSON Schema

```json
{
  "metadata": {
    "platform": "Trovu",
    "learningArea": "Health and Physical Education",
    "topicId": "identity-development",
    "topicTitle": "Identity Development",
    "yearLevel": "7-8",
    "partNumber": 1,
    "totalParts": 3,
    "strand": "Health",
    "curriculumCodes": ["VCHPEP128", "VCHPEP129"],
    "version": "1.0",
    "lastUpdated": "2024-12-21",
    "author": "AI-generated",
    "reviewStatus": "draft"
  },
  "literacyLevels": {
    "A": { /* Easier - see below */ },
    "B": { /* Building */ },
    "C": { /* Standard */ },
    "D": { /* Challenge */ },
    "E": { /* Expert */ }
  }
}
```

---

## Literacy Levels (A–E)

Each level contains the **same curriculum content** but written for different reading abilities:

| Level | Name | Target | Language Style |
|-------|------|--------|----------------|
| **A** | Easier | 2-3 years below | Simple sentences, common words, concrete examples, shorter paragraphs |
| **B** | Building | 1 year below | Clear language, some scaffolding, supported vocabulary |
| **C** | Standard | At level | Grade-appropriate language, balanced complexity |
| **D** | Challenge | 1 year above | Richer vocabulary, more complex sentence structures, deeper connections |
| **E** | Expert | 2+ years above | Academic language, nuanced concepts, abstract reasoning, technical terminology |

**Important:** All levels teach the SAME content and meet the SAME learning outcomes. Only the language complexity changes.

---

## Section Structure (within each literacy level)

### 1. whatYouWillLearn
```json
{
  "coreLearning": "One paragraph overview of what students will learn",
  "learningIntentions": [
    "I am learning to...",
    "I am learning to...",
    "I am learning to..."
  ],
  "successCriteria": [
    {
      "criterion": "I can [observable skill/knowledge]",
      "evidence": "This looks like [specific observable behaviour]"
    }
  ]
}
```

### 2. explicatoryContent
```json
{
  "introduction": "Engaging opening paragraph that hooks the student",
  "keyPoints": [
    "Key point 1: Clear, memorable statement",
    "Key point 2: ...",
    "Key point 3: ...",
    "Key point 4: ..."
  ],
  "vocabulary": [
    {
      "term": "Word",
      "pronunciation": "WORD",
      "definition": "Student-friendly definition"
    }
  ],
  "analogies": [
    {
      "analogy": "It's like...",
      "explanation": "This helps because..."
    }
  ],
  "conceptExplanation": "Main body of explanation - 2-4 paragraphs of clear, engaging content"
}
```

### 3. caseStudy
```json
{
  "title": "Descriptive scenario title",
  "scenario": "A realistic, relatable story/situation (2-3 paragraphs)",
  "observations": [
    "What to notice about this scenario",
    "Another observation point"
  ],
  "questions": [
    "Thinking question about the scenario",
    "Another reflection question"
  ],
  "realWorldConnection": "Why this matters in real life",
  "modelAnalysis": {
    "strengths": ["What was done well in the scenario"],
    "improvements": ["What could be improved"]
  }
}
```

### 4. assessmentBlooms
Contains questions at each Bloom's taxonomy level. Include 1-2 questions per level that has content.

```json
{
  "remember": [
    {
      "type": "multipleChoice",
      "stem": "Question text?",
      "difficulty": "foundation",
      "options": [
        { "id": "A", "text": "Option text", "isCorrect": true, "feedback": "Correct because..." },
        { "id": "B", "text": "Option text", "isCorrect": false, "feedback": "Not quite because..." },
        { "id": "C", "text": "Option text", "isCorrect": false, "feedback": "..." },
        { "id": "D", "text": "Option text", "isCorrect": false, "feedback": "..." }
      ]
    }
  ],
  "understand": [
    {
      "type": "shortAnswer",
      "stem": "Explain in your own words...",
      "difficulty": "developing",
      "rubric": "A good answer includes...",
      "successCriteria": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "apply": [ /* Similar structure */ ],
  "analyse": [ /* Similar structure */ ],
  "evaluate": [ /* Similar structure */ ],
  "create": [
    {
      "type": "extendedResponse",
      "stem": "Design/Create/Develop...",
      "difficulty": "advanced",
      "rubric": "Marking criteria..."
    }
  ]
}
```

**Question Types:**
- `multipleChoice` — 4 options, one correct, feedback for each
- `shortAnswer` — 2-4 sentence response expected
- `extendedResponse` — Paragraph or creative response

**Difficulty Levels:** `foundation`, `developing`, `proficient`, `advanced`

### 5. assessmentSOLO
Questions at each SOLO taxonomy level:

```json
{
  "unistructural": [
    {
      "stem": "Identify ONE...",
      "difficulty": "foundation",
      "modelResponse": "Example answer showing single idea",
      "rubric": "Identifies one relevant point"
    }
  ],
  "multistructural": [
    {
      "stem": "List SEVERAL...",
      "difficulty": "developing",
      "modelResponse": "Example showing multiple unconnected ideas",
      "rubric": "Identifies multiple relevant points"
    }
  ],
  "relational": [
    {
      "stem": "Explain HOW... RELATES to...",
      "difficulty": "proficient",
      "modelResponse": "Example showing connected ideas",
      "rubric": "Shows relationships between ideas"
    }
  ],
  "extendedAbstract": [
    {
      "stem": "Predict/Hypothesise/Generalise...",
      "difficulty": "advanced",
      "modelResponse": "Example showing transfer to new context",
      "rubric": "Extends learning beyond given context"
    }
  ]
}
```

### 6. studentReflection
```json
{
  "reflectionQuestions": [
    { "question": "What was the most interesting thing you learned?" },
    { "question": "What do you still wonder about?" },
    { "question": "How does this connect to your own life?" }
  ],
  "selfAssessment": [
    { "criterion": "I can explain the main ideas from this topic" },
    { "criterion": "I can give examples from my own experience" },
    { "criterion": "I feel confident to learn more about this" }
  ],
  "connectionToLife": "How might you use what you learned today outside of school?"
}
```

---

## Content Guidelines

### Do:
- Use Australian English spelling (behaviour, colour, organisation)
- Use inclusive, respectful language
- Make content relatable to Australian students
- Include diverse examples (names, contexts, family structures)
- Connect to real-world Australian contexts where relevant
- Use age-appropriate scenarios
- Scaffold complexity appropriately for each literacy level

### Don't:
- Use American spellings or cultural references
- Include stereotypes or biased content
- Make assumptions about family structure, religion, or background
- Use overly academic language for lower literacy levels
- Simplify content/outcomes for lower levels (only simplify language)

### For HPE specifically:
- Be sensitive with body image, mental health, and relationships content
- Use strengths-based language
- Avoid fear-based messaging
- Emphasise personal agency and help-seeking
- Include diverse body types, abilities, and identities in examples

---

## Example: Level C (Standard) — whatYouWillLearn

```json
{
  "coreLearning": "In this topic, you'll explore how your identity develops during adolescence. You'll learn about the factors that shape who you are, including your values, beliefs, relationships, and experiences. Understanding identity helps you make decisions that align with who you want to become.",
  "learningIntentions": [
    "I am learning to identify the factors that influence my personal identity",
    "I am learning to describe how identity can change over time",
    "I am learning to recognise the role of values and beliefs in shaping identity"
  ],
  "successCriteria": [
    {
      "criterion": "I can name at least four factors that influence identity",
      "evidence": "I can explain how family, peers, culture, and experiences each contribute to who I am"
    },
    {
      "criterion": "I can describe how identity changes during adolescence",
      "evidence": "I can give examples of how my own interests, values, or beliefs have changed over time"
    },
    {
      "criterion": "I can explain why understanding identity matters",
      "evidence": "I can connect identity awareness to making positive choices"
    }
  ]
}
```

---

## Complete Output Format

Provide the complete JSON file with all metadata and all 5 literacy levels (A, B, C, D, E) fully populated. Each level should have all 6 sections complete.

The output should be valid JSON that can be saved directly to a file.

---

## Checklist Before Submitting

- [ ] Metadata is complete with correct topic details
- [ ] All 5 literacy levels (A–E) are present
- [ ] All 6 sections in each level are complete
- [ ] Language complexity varies appropriately across levels
- [ ] Learning outcomes are consistent across levels
- [ ] Australian English spelling used throughout
- [ ] Content is inclusive and respectful
- [ ] Questions have appropriate difficulty progression
- [ ] All JSON is valid (no trailing commas, proper nesting)

---

## Ready?

Generate the complete JSON file for:

**[INSERT TOPIC DETAILS HERE]**