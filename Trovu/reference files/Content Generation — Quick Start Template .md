# Trovu Content Generation — Quick Start Template

Copy this prompt, fill in the [PLACEHOLDERS], and use it to generate content.

---

## Prompt

```
Generate a Trovu content file for the Victorian Curriculum.

TOPIC DETAILS:
- Learning Area: [e.g., Health and Physical Education]
- Topic ID: [e.g., identity-development]
- Topic Title: [e.g., Identity Development]  
- Year Level: [e.g., 7-8]
- Part: [e.g., 1 of 3]
- Strand: [e.g., Health]
- Curriculum Codes: [e.g., VCHPEP128, VCHPEP129]
- Focus: [Brief description of what this part covers]

OUTPUT: Complete JSON file with:
- metadata object
- literacyLevels object with levels A, B, C, D, E
- Each level contains: whatYouWillLearn, explicatoryContent, caseStudy, assessmentBlooms, assessmentSOLO, studentReflection

LITERACY LEVELS:
- A (Easier): Simple sentences, common words, concrete examples
- B (Building): Clear language, some scaffolding
- C (Standard): Grade-appropriate complexity
- D (Challenge): Richer vocabulary, deeper connections
- E (Expert): Academic language, abstract reasoning

REQUIREMENTS:
- Australian English spelling
- Inclusive, diverse examples
- Same learning outcomes across all levels (only language changes)
- Valid JSON format
- Age-appropriate for [YEAR_LEVEL]

FILENAME: [area]_[topic-id]_[level]_topic-[n].json
Example: hpe_identity-development_7-8_topic-1.json
```

---

## Example Filled Prompt

```
Generate a Trovu content file for the Victorian Curriculum.

TOPIC DETAILS:
- Learning Area: Health and Physical Education
- Topic ID: identity-development
- Topic Title: Identity Development
- Year Level: 7-8
- Part: 1 of 3
- Strand: Health
- Curriculum Codes: VCHPEP128, VCHPEP129
- Focus: Understanding what identity is and the factors that shape it (family, culture, peers, media, experiences)

OUTPUT: Complete JSON file with:
- metadata object
- literacyLevels object with levels A, B, C, D, E
- Each level contains: whatYouWillLearn, explicatoryContent, caseStudy, assessmentBlooms, assessmentSOLO, studentReflection

LITERACY LEVELS:
- A (Easier): Simple sentences, common words, concrete examples
- B (Building): Clear language, some scaffolding
- C (Standard): Grade-appropriate complexity
- D (Challenge): Richer vocabulary, deeper connections
- E (Expert): Academic language, abstract reasoning

REQUIREMENTS:
- Australian English spelling
- Inclusive, diverse examples
- Same learning outcomes across all levels (only language changes)
- Valid JSON format
- Age-appropriate for Years 7-8

FILENAME: hpe_identity-development_7-8_topic-1.json
```

---

## Section Quick Reference

| Section | Purpose | Key Elements |
|---------|---------|--------------|
| `whatYouWillLearn` | Learning goals | coreLearning, learningIntentions[], successCriteria[] |
| `explicatoryContent` | Main teaching | introduction, keyPoints[], vocabulary[], analogies[], conceptExplanation |
| `caseStudy` | Real-world example | title, scenario, observations[], questions[], realWorldConnection, modelAnalysis |
| `assessmentBlooms` | Thinking levels | remember[], understand[], apply[], analyse[], evaluate[], create[] |
| `assessmentSOLO` | Complexity levels | unistructural[], multistructural[], relational[], extendedAbstract[] |
| `studentReflection` | Self-assessment | reflectionQuestions[], selfAssessment[], connectionToLife |

---

## Batch Generation

For generating multiple files, provide a list:

```
Generate Trovu content files for these topics:

1. hpe_identity-development_7-8_topic-1.json
   Focus: What is identity? Factors that shape identity.

2. hpe_identity-development_7-8_topic-2.json
   Focus: How identity changes during adolescence.

3. hpe_identity-development_7-8_topic-3.json
   Focus: Values, beliefs, and making identity-aligned decisions.

[Use same requirements as above for each file]
```

---

## Validation Checklist

Before using generated content:

- [ ] JSON parses without errors
- [ ] All 5 levels present (A, B, C, D, E)
- [ ] All 6 sections in each level
- [ ] Metadata matches filename
- [ ] Australian spelling throughout
- [ ] Reading complexity varies appropriately
- [ ] Learning outcomes consistent across levels